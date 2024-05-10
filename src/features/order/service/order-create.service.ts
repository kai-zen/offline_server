import { ProductFetchService } from "src/features/product/product/service/product-fetch.service";
import { AuthService } from "src/features/user/auth/auth.service";
import { EventsGateway } from "src/websocket/events.gateway";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { OrderDocument } from "../order.schema";
import { OrderThirdMethodsService } from "./third-methods.actions";
import { PaymentService } from "./../../../management/payment/payment.service";
import { UserDocument } from "src/features/user/users/user.schema";
import { UserService } from "src/features/user/users/user.service";
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from "@nestjs/common";
import { BlacklistService } from "src/features/complex/blacklist/blacklist.service";
import { ComplexUsersActionsService } from "src/features/complex/users/service/complex-user-actions.service";
import { toObjectId } from "src/helpers/functions";
import { messages } from "src/helpers/constants";
import { CashBankService } from "src/features/complex/cash-bank/cash-bank.service";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { ComplexUserAddressService } from "src/features/complex/user-address/user-address.service";

@Injectable()
export class OrderCreateService {
  constructor(
    @InjectModel("order")
    private readonly model: Model<OrderDocument>,
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly eventsGateway: EventsGateway,
    private readonly orderThirdMethods: OrderThirdMethodsService,
    private readonly blackListService: BlacklistService,
    private readonly complexUsersActionsService: ComplexUsersActionsService,
    private readonly complexUserAddressService: ComplexUserAddressService,
    private readonly productFetchService: ProductFetchService,
    @Inject(forwardRef(() => PaymentService))
    private readonly paymentService: PaymentService,
    @Inject(forwardRef(() => CashBankService))
    private readonly cashBankService: CashBankService,
    @InjectQueue("offline_orders") private readonly queue: Queue
  ) {}

  async create(
    user: UserDocument,
    data: {
      description: string;
      products: { product_id: string; quantity: number; price_index: number }[];
      complex_id: string;
      needs_pack?: boolean;
      user_address?: {
        name: string;
        description: string;
        latitude: number;
        longitude: number;
      };
      table_number?: string;
      discount_id?: string;
    },
    is_platform: boolean
  ) {
    const {
      user_address,
      products,
      description,
      discount_id,
      complex_id,
      table_number,
      needs_pack,
    } = data || {};

    const isBanned = await this.blackListService.isBanned(
      user._id.toString(),
      complex_id
    );
    if (isBanned)
      throw new ForbiddenException(
        "متاسفانه امکان سفارش از این مجموعه برای شما وجود ندارد."
      );

    // validate complex activation and workhours
    const theComplex =
      await this.orderThirdMethods.isValidCreateRequest(complex_id);
    const productsFullData =
      await this.orderThirdMethods.productDataHandler(products);

    const needsPack = user_address?.description ? true : Boolean(needs_pack);
    const servicePrice = !needsPack ? theComplex.service || 0 : 0;

    if (needsPack) {
      const justIndoorIndex = productsFullData.findIndex((item) =>
        user_address?.description
          ? !item.product.has_shipping
          : !item.product.is_packable
      );
      if (justIndoorIndex !== -1)
        throw new BadRequestException(
          "سفارش شما حاوی محصولاتی است که امکان بسته‌بندی بیرون‌بر ندارد."
        );
    }

    const theRange = await this.orderThirdMethods.shippingRangeHandler({
      complex_id,
      user_address,
    });

    // calculate different prices
    const shipping_price = !Boolean(user_address?.description)
      ? 0
      : theRange.price;
    const { products_price, packing_price, complex_discount } =
      await this.orderThirdMethods.priceHandler({
        products: productsFullData,
        complex_packing_price: theComplex.packing,
        complex_id,
      });

    // validate and apply user discount code
    const theUserDiscount =
      await this.orderThirdMethods.priceAndDiscountValidator({
        discount_id,
        user_id: user._id,
        min_order_price: user_address?.description
          ? theComplex.min_online_ordering_price
          : 0,
        products_price,
      });

    const tax = ((theComplex.tax || 0) * products_price) / 100 || 0;

    const factor_number = await this.orderThirdMethods.factorNumber(complex_id);

    const newRecord = new this.model({
      order_type: 3,
      payment_type: 1,
      needs_pack: needsPack,
      description,
      user,
      user_address: user_address || null,
      user_phone: user.mobile,
      products: productsFullData,
      shipping_price,
      packing_price: !needsPack ? 0 : packing_price,
      total_price:
        products_price +
        (!needsPack ? 0 : packing_price) +
        shipping_price +
        tax +
        servicePrice,
      complex: theComplex,
      user_discount: theUserDiscount?.value || 0,
      complex_discount,
      table_number: table_number || null,
      factor_number,
      tax,
      service: servicePrice,
      created_at: new Date(),
    });
    const created_order = await newRecord.save();

    // websocket
    if (table_number)
      await this.eventsGateway.addOrder(complex_id, created_order);

    // update stats
    await this.orderThirdMethods.deleteDiscount(theUserDiscount?.id);

    if (user._id && user_address?.description) {
      // save the address
      if (theComplex.auto_copy_addresses)
        await this.complexUserAddressService.addByOrdering({
          address: user_address,
          complex_id,
          user_id: user._id.toString(),
        });

      // make payment
      const params = theComplex.is_website
        ? {
            user,
            order: created_order,
            domain: theComplex.domain,
            merchant_id: is_platform
              ? undefined
              : theComplex.gateway?.gate_id || undefined,
            is_platform,
          }
        : { user, order: created_order, is_platform };
      return await this.paymentService.create(params);
    }
    return created_order;
  }

  async createByEmployee(data: {
    order_type: 1 | 2 | 3;
    payment_type: 1 | 2 | 3 | 4 | 5 | 6;
    description: string;
    products: { product_id: string; quantity: number; price_index: number }[];
    complex_id: string;
    needs_pack?: boolean;
    user_address?: {
      name: string;
      description: string;
      latitude: number;
      longitude: number;
    };
    cashbank_id: string;
    shipping_price?: number;
    user_phone?: string;
    table_number?: string;
  }) {
    const {
      order_type,
      payment_type,
      user_address,
      user_phone,
      products,
      description,
      complex_id,
      table_number,
      needs_pack,
      cashbank_id,
    } = data || {};
    let { shipping_price } = data;

    let theUser: UserDocument | null;
    if (user_phone) {
      theUser = await this.userService.findByMobile(user_phone);
      if (!theUser) theUser = await this.authService.registerUser(user_phone);
    }

    // validate complex activation and workhours
    const theComplex =
      await this.orderThirdMethods.isValidCreateRequest(complex_id);

    const productsFullData =
      await this.orderThirdMethods.productDataHandler(products);

    const theRange = await this.orderThirdMethods.shippingRangeHandler({
      complex_id,
      user_address,
    });

    const theCashBank = await this.cashBankService.findById(
      cashbank_id,
      complex_id
    );
    if ((payment_type !== 1 && !theCashBank) || payment_type === 2)
      throw new BadRequestException(messages[400]);
    if (cashbank_id && !theCashBank)
      throw new NotFoundException("صندوق مورد نظر شما وجود ندارد.");

    // calculate different prices
    if (!shipping_price)
      shipping_price = !Boolean(user_address?.description) ? 0 : theRange.price;

    const { products_price, packing_price, complex_discount } =
      await this.orderThirdMethods.priceHandler({
        products: productsFullData,
        complex_packing_price: theComplex.packing,
        complex_id,
      });

    const tax = (theComplex.tax * products_price) / 100;

    const needsPack = Boolean(user_address?.description)
      ? true
      : Boolean(needs_pack);
    const servicePrice = !needsPack ? theComplex.service : 0;

    if (needsPack) {
      const justIndoorIndex = productsFullData.findIndex((item) =>
        user_address?.description
          ? !item.product.has_shipping
          : !item.product.is_packable
      );
      if (justIndoorIndex !== -1)
        throw new BadRequestException(
          "سفارش شما حاوی محصولاتی است که امکان بسته‌بندی بیرون‌بر ندارد."
        );
    }

    const factor_number = await this.orderThirdMethods.factorNumber(complex_id);

    const newRecord = new this.model({
      order_type,
      payment_type,
      needs_pack: needsPack,
      description,
      user: theUser?._id || null,
      user_address: user_address || null,
      user_phone,
      products: productsFullData,
      shipping_price,
      packing_price: !needsPack ? 0 : packing_price,
      total_price:
        products_price +
        (!needsPack ? 0 : packing_price) +
        shipping_price +
        tax +
        servicePrice,
      complex_discount,
      complex: theComplex,
      user_discount: 0,
      table_number,
      factor_number,
      tax,
      service: servicePrice,
      cash_bank: theCashBank || null,
      created_at: new Date(),
    });
    const created_order = await newRecord.save();

    // websocket
    await this.eventsGateway.addOrder(complex_id, created_order);

    if (payment_type === 6 && created_order.total_price !== 0)
      await this.complexUsersActionsService.addDebt({
        complex_id,
        user_id: theUser._id.toString(),
        theOrder: created_order,
      });

    return created_order;
  }

  async addItemsToExistingOrder(data: {
    order_id: string;
    products: { product_id: string; quantity: number; price_index: number }[];
    complex_id: string;
  }) {
    const { products, complex_id, order_id } = data;

    const theOrder = await this.model
      .findOne({
        _id: toObjectId(order_id),
        complex: toObjectId(complex_id),
      })
      .populate("products.product")
      .populate("user")
      .exec();
    if (!theOrder) throw new NotFoundException(messages[404]);
    if (theOrder.status > 4)
      throw new BadRequestException(
        "امکان اضافه کردن موارد جدید فقط روی سفارشات فعال و حضوری وجود دارد."
      );

    // validate complex activation and workhours
    const theComplex =
      await this.orderThirdMethods.isValidCreateRequest(complex_id);

    const productsFullData = await this.orderThirdMethods.productDataHandler(
      products,
      true
    );

    // calculate different prices
    const { order_price, complex_discount, total_packing } =
      await this.orderThirdMethods.productsPriceHandler({
        products: productsFullData,
        complex_id,
      });

    const tax = Math.floor(
      (theComplex.tax * (order_price - total_packing)) / 100
    );
    const total_price = order_price + tax;

    theOrder.products = [...theOrder.products, ...productsFullData];
    theOrder.total_price += total_price;
    theOrder.complex_discount += complex_discount;
    theOrder.tax += tax;
    theOrder.packing_price += theOrder.needs_pack ? total_packing : 0;
    const edited_order = await theOrder.save();

    // websocket
    await this.eventsGateway.changeOrder({ complex_id, order: edited_order });

    return edited_order;
  }

  async removeItemFromExistingOrder(data: {
    order_id: string;
    complex_id: string;
    price_id: string;
    product_id: string;
  }) {
    const { price_id, complex_id, order_id, product_id } = data;

    const theOrder = await this.model
      .findOne({
        _id: toObjectId(order_id),
        complex: toObjectId(complex_id),
      })
      .exec();

    if (!theOrder) throw new NotFoundException("سفارش پیدا نشد.");
    if (theOrder.status > 4)
      throw new BadRequestException(
        "امکان حذف کردن موارد فقط روی سفارشات فعال و حضوری وجود دارد."
      );

    const copy = [...theOrder.toObject().products];
    const theOrderProductIndex = copy.findIndex(
      (p) => p.price.price_id.toString() === price_id
    );
    if (theOrderProductIndex === -1)
      throw new NotFoundException("محصول مورد نظر پیدا نشذ.");

    const theProductData = { ...copy[theOrderProductIndex] };
    if (!theProductData) throw new NotFoundException("محصول مربوطه یافت نشد.");

    if (copy[theOrderProductIndex].quantity > 1)
      copy[theOrderProductIndex].quantity -= 1;
    else if (copy.length === 1) throw new BadRequestException(messages[400]);
    else copy.splice(theOrderProductIndex, 1);

    const originalPrice = await this.productFetchService.findPrice(
      product_id,
      price_id
    );
    const calculatedDiscount = originalPrice
      ? originalPrice - theProductData.price.amount
      : 0;

    theOrder.products = copy;
    theOrder.complex_discount -= calculatedDiscount;
    theOrder.total_price -= theProductData.price.amount;
    const edited_order = await theOrder.save();

    // websocket
    await this.eventsGateway.changeOrder({ complex_id, order: edited_order });
    return edited_order;
  }

  async loadOfflineOrders(data: {
    complex_id: string;
    orders: {
      order_type: 1 | 2 | 3;
      payment_type: 1 | 2 | 3 | 4 | 5 | 6;
      status: 1 | 2 | 3 | 4 | 5 | 6 | 7;
      description: string;
      products: { product_id: string; quantity: number; price_index: number }[];
      needs_pack: boolean;
      user_address: {
        name: string;
        description: string;
        latitude: number;
        longitude: number;
      } | null;
      created_at: string;

      // prices
      shipping_price: number;
      packing_price: number;
      user_discount: number;
      extra_price: number;
      complex_discount: number;
      service: number;

      cashbank_id?: string;
      user_phone?: string;
      table_number?: string;
    }[];
  }) {
    const { complex_id, orders } = data || {};
    this.queue.add({ orders, complex_id });
  }
}
