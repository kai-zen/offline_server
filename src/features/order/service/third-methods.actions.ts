import ProductFetchService from "src/features/product/product/service/product-fetch.service";
import { ComplexFetchService } from "src/features/complex/complex/service/comlex-fetch.service";
import { ComplexUsersActionsService } from "src/features/complex/users/service/complex-user-actions.service";
import { discountCalculator } from "src/features/product/product/helpers/functions";
import { DiscountService } from "src/features/product/discount/discount.service";
import { messages } from "src/helpers/constants";
import { OrderDocument } from "../order.schema";
import { PersonalDiscountService } from "src/features/user/personal-discount/personal-discount.service";
import { ProductDocument } from "src/features/product/product/product.schema";
import { ShippingRangeDocument } from "src/features/complex/shipping-range/shipping-range.schema";
import { ShippingRangeService } from "src/features/complex/shipping-range/shipping-range.service";
import { Model, Types } from "mongoose";
import { WorkTimeService } from "src/features/complex/work-time/work-time.service";
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Complex } from "src/features/complex/complex/complex.schema";
import { toObjectId } from "src/helpers/functions";
import { InjectModel } from "@nestjs/mongoose";

@Injectable()
export class OrderThirdMethodsService {
  constructor(
    @InjectModel("order")
    private readonly model: Model<OrderDocument>,
    private readonly productService: ProductFetchService,
    private readonly complexService: ComplexFetchService,
    private readonly shippingRangeService: ShippingRangeService,
    private readonly personalDiscountService: PersonalDiscountService,
    private readonly complexUsersActionsService: ComplexUsersActionsService,
    private readonly worktimeService: WorkTimeService,
    private readonly discountService: DiscountService
  ) {}

  async isValidCreateRequest(complex_id: string) {
    const theComplex: Complex = await this.complexService.findById(complex_id);
    if (!theComplex) throw new NotFoundException(messages[404]);

    const isOpen = await this.worktimeService.isOpen(complex_id);
    if (!theComplex.is_active)
      throw new BadRequestException(
        "متاسفانه مجموعه مورد نظر شما هنوز به تایید سفره نرسیده است."
      );
    if (!isOpen)
      throw new BadRequestException(
        `متاسفانه در حال حاضر مجموعه سفارشی نمیپذیرد. ${new Date().getHours()}:${new Date().getMinutes()}`
      );

    return theComplex;
  }

  async productDataHandler(
    products: { product_id: string; quantity: number; price_index: number }[],
    added_later?: boolean
  ) {
    const productsFullData: {
      product: ProductDocument;
      quantity: number;
      price: {
        amount: number;
        title: string;
        price_id: string;
      };
      added_later: boolean;
    }[] = [];
    for await (const product of products) {
      const { product_id, quantity, price_index } = product || {};
      const fullData = await this.productService.findById(product_id);
      if (fullData && fullData.prices[price_index])
        productsFullData.push({
          product: fullData,
          quantity: quantity || 1,
          price: {
            amount: fullData.prices[price_index].price,
            title: fullData.prices[price_index].title, // @ts-ignore
            price_id: fullData.prices[price_index]._id,
          },
          added_later: Boolean(added_later),
        });
    }
    return productsFullData;
  }

  async shippingRangeHandler(data: {
    complex_id: string;
    user_address?: {
      name: string;
      description: string;
      latitude: number;
      longitude: number;
    };
  }) {
    const { user_address, complex_id } = data;
    let theRange: ShippingRangeDocument | null;
    if (user_address) {
      const { latitude, longitude } = user_address || {};
      if (!latitude || !longitude)
        throw new BadRequestException("مختصات جغرافیایی وارد نشده است.");
      else
        theRange = await this.shippingRangeService.findCorrespondingRange(
          [user_address.latitude, user_address.longitude],
          complex_id
        );

      if (!theRange)
        throw new ForbiddenException(
          "متاسفانه شما در محدوده ارسال مجموعه قرار ندارید."
        );
      return theRange;
    }
    return null;
  }

  async priceHandler(data: {
    complex_id: string;
    complex_packing_price: number;
    products: {
      product: ProductDocument;
      quantity: number;
      price: {
        amount: number;
        title: string;
        price_id: string;
      };
    }[];
  }) {
    const { complex_packing_price, products, complex_id } = data;

    const complexDiscounts =
      await this.discountService.findAllActiveComplexDiscounts(complex_id);

    let products_price = 0;
    let packing_price = complex_packing_price || 0;
    let complex_discount = 0;

    products.forEach((item) => {
      const discountPercent = discountCalculator(
        item.product,
        complexDiscounts
      );

      const theProductDiscount =
        ((item.price.amount * discountPercent) / 100) * item?.quantity || 0;

      const theProductCost =
        item.price.amount * item?.quantity - theProductDiscount || 0;
      const thePackingCost = item.product.packing * item?.quantity || 0;

      products_price += theProductCost;
      complex_discount += theProductDiscount;
      packing_price += thePackingCost;
    });
    return { products_price, packing_price, complex_discount };
  }

  async productsPriceHandler(data: {
    complex_id: string;
    products: {
      product: ProductDocument;
      quantity: number;
      price: {
        amount: number;
        title: string;
        price_id: string;
      };
    }[];
  }) {
    const { products, complex_id } = data;

    const complexDiscounts =
      await this.discountService.findAllActiveComplexDiscounts(complex_id);

    let order_price = 0;
    let complex_discount = 0;
    let total_packing = 0;

    products.forEach((item) => {
      const discountPercent = discountCalculator(
        item.product,
        complexDiscounts
      );
      const theProductDiscount =
        ((item.price.amount * discountPercent) / 100) * item?.quantity || 0;
      const theProductCost =
        item.price.amount * item?.quantity - theProductDiscount || 0;
      const thePackingCost = item.product.packing * item?.quantity || 0;
      order_price += theProductCost + thePackingCost;
      complex_discount += theProductDiscount;
      total_packing += thePackingCost;
    });
    return { total_packing, order_price, complex_discount };
  }

  async priceAndDiscountValidator(data: {
    products_price: number;
    discount_id: string;
    user_id: string | Types.ObjectId;
    min_order_price: number;
  }) {
    const { products_price, discount_id, user_id, min_order_price } = data;

    const theUserDiscount = await this.personalDiscountService.findUserCode({
      _id: discount_id,
      user_id,
    });

    if (
      theUserDiscount?.min_order &&
      products_price < theUserDiscount.min_order
    )
      throw new BadRequestException(
        `حداقل مبلغ سفارش برای اعمال تخفیف شما ${theUserDiscount.min_order.toLocaleString()} تومان است`
      );

    if (products_price <= min_order_price)
      throw new BadRequestException(
        `حداقل مبلغ برای ثبت سفارش آنلاین ${min_order_price} است`
      );

    return theUserDiscount;
  }

  async statsHandler(data: {
    created_order: OrderDocument;
    complex_id: string;
    products: {
      product: ProductDocument;
      quantity: number;
      price: {
        amount: number;
        title: string;
        price_id: string;
      };
    }[];
    user_id?: string | Types.ObjectId;
  }) {
    const { created_order, complex_id, products, user_id } = data;

    if (user_id)
      await this.complexUsersActionsService.addNewOrder({
        complex_id,
        order: created_order,
        products: products.map((item) => ({
          _id: item.product._id.toString(),
          quantity: item?.quantity || 0,
        })),
        user_id,
      });
  }

  async factorNumber(complex_id: string) {
    const todayOrdersCount = await this.model
      .find({
        $and: [
          { complex: toObjectId(complex_id) },
          {
            created_at: {
              $gte: new Date().setHours(0, 0, 0, 0),
              $lte: new Date().setHours(23, 59, 59, 999),
            },
          },
        ],
      })
      .countDocuments();
    return todayOrdersCount + 1;
  }

  async deleteDiscount(discount_id: string) {
    return await this.personalDiscountService.deleteOne(discount_id);
  }
}
