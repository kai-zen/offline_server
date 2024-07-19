import { EventsGateway } from "src/websocket/events.gateway";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { findItemByPriceId, toObjectId } from "src/helpers/functions";
import { messages } from "src/helpers/constants";
import { OrderDocument } from "../../order.schema";
import { OrderThirdMethodsService } from "../helpers.service";
import ProductService from "src/features/product/product/product.service";

@Injectable()
export class OrderEditItemsService {
  constructor(
    @InjectModel("order")
    private readonly model: Model<OrderDocument>,
    private readonly eventsGateway: EventsGateway,
    private readonly orderThirdMethods: OrderThirdMethodsService,
    private readonly productFetchService: ProductService
  ) {}

  async modifyItems(data: {
    products: { product_id: string; quantity: number; price_index: number }[];
    complex_id: string;
    order_id: string;
  }) {
    const { products, complex_id, order_id } = data || {};

    const theRecord = await this.model
      .findOne({
        _id: toObjectId(order_id),
        complex: toObjectId(complex_id),
      })
      .populate("products.product")
      .populate("user", "name mobile")
      .exec();
    if (!theRecord) throw new BadRequestException(messages[404]);
    if (theRecord?.status > 4)
      throw new BadRequestException(
        "امکان اضافه کردن موارد جدید فقط روی سفارشات فعال و حضوری وجود دارد."
      );

    // validate complex activation and workhours
    const theComplex = await this.orderThirdMethods.isValidCreateRequest();

    const productsFullData =
      await this.orderThirdMethods.productDataHandler(products);

    const { products_price, packing_price, complex_discount } =
      await this.orderThirdMethods.priceHandler({
        products: productsFullData,
        complex_packing_price: theComplex.packing,
      });
    const tax = (theComplex.tax * products_price) / 100;
    const servicePrice = theRecord.service;
    const packingPrice = theRecord?.table_number ? 0 : packing_price;

    // **complex discount is calculated in productsprice**
    const allExpences =
      products_price +
      packingPrice +
      theRecord.shipping_price +
      tax +
      servicePrice;

    const before = [
      ...(theRecord.toObject ? theRecord.toObject() : theRecord).products,
    ];
    const after = [...productsFullData];
    const combined = [];
    before.forEach((item) => {
      const afterItem = findItemByPriceId(after, item.price.price_id);
      if (afterItem)
        combined.push({
          ...item,
          quantity: afterItem.quantity,
          diff: afterItem.quantity - item.quantity,
        });
      else combined.push({ ...item, quantity: 0, diff: item.quantity * -1 });
    });

    after.forEach((item) => {
      const beforeItem = findItemByPriceId(before, item.price.price_id);
      if (!beforeItem) combined.push({ ...item, diff: item.quantity });
    });

    theRecord.products = productsFullData;
    theRecord.packing_price = packingPrice;
    theRecord.total_price = allExpences;
    theRecord.complex_discount = complex_discount;
    theRecord.tax = tax;

    const edited_order = await theRecord.save();
    const copy = { ...edited_order.toObject() };

    // websocket
    await this.eventsGateway.changeOrder({
      order: { ...copy, products: combined } as OrderDocument,
      message: `موارد فاکتور ${theRecord.factor_number} اصلاح شد.`,
    });
    return edited_order;
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
      .populate("user", "name mobile")
      .exec();
    if (!theOrder) throw new NotFoundException(messages[404]);
    if (theOrder.status > 4)
      throw new BadRequestException(
        "امکان اضافه کردن موارد جدید فقط روی سفارشات فعال وجود دارد."
      );

    // validate complex activation and workhours
    const theComplex = await this.orderThirdMethods.isValidCreateRequest();

    const productsFullData =
      await this.orderThirdMethods.productDataHandler(products);

    // calculate different prices
    const { order_price, complex_discount, total_packing } =
      await this.orderThirdMethods.productsPriceHandler({
        products: productsFullData,
      });

    const tax = Math.floor(
      (theComplex.tax * (order_price - total_packing)) / 100
    );
    const total_price = order_price + tax;

    theOrder.products = [
      ...theOrder.products,
      ...productsFullData.map((p) => ({ ...p, diff: p.quantity })),
    ];
    theOrder.total_price += total_price;
    theOrder.complex_discount += complex_discount;
    theOrder.tax += tax;
    theOrder.packing_price += theOrder.table_number ? 0 : total_packing || 0;
    const edited_order = await theOrder.save();

    // websocket
    const socketMessage = `${productsFullData.map(
      (p) => `${p.product?.name} ${p.price?.title || ""}، `
    )} به فاکتور ${theOrder.factor_number} اضافه شد`;
    await this.eventsGateway.changeOrder({
      order: edited_order,
      message: socketMessage,
    });

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
      .populate("products.product")
      .exec();

    if (!theOrder) throw new NotFoundException("سفارش پیدا نشد.");
    if (theOrder.status > 4)
      throw new BadRequestException(
        "امکان حذف کردن موارد فقط روی سفارشات فعال و حضوری وجود دارد."
      );

    // find the index and copy all
    const copy = [...theOrder.toObject().products];
    const theOrderProductIndex = copy.findIndex(
      (p) => p.price.price_id.toString() === price_id
    );
    if (theOrderProductIndex === -1)
      throw new NotFoundException("محصول مورد نظر پیدا نشذ.");

    // copy the product
    const theProductData = { ...copy[theOrderProductIndex] };
    if (!theProductData) throw new NotFoundException("محصول مربوطه یافت نشد.");

    const modifiedProducts = copy.map((p, i) => ({
      ...p,
      quantity: i === theOrderProductIndex ? p.quantity - 1 : p.quantity,
      diff: i === theOrderProductIndex ? -1 : 0,
    }));

    if (copy[theOrderProductIndex].quantity > 1)
      copy[theOrderProductIndex].quantity -= 1;
    else if (copy.length === 1)
      throw new BadRequestException(
        "بجای حذف تمام محصولات، سفارش را لغو کنید."
      );
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
    const socketMessage = `یک ${theProductData?.product?.name} ${
      theProductData.price.title || ""
    } از فاکتور ${edited_order.factor_number} کم شد`;

    const order = {
      ...edited_order.toObject(),
      products: modifiedProducts,
    } as OrderDocument;
    await this.eventsGateway.changeOrder({
      order,
      message: socketMessage,
    });
    return edited_order;
  }
}
