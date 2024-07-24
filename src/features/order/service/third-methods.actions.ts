import ProductFetchService from "src/features/product/product/product.service";
import { discountCalculator } from "src/features/product/product/helpers/functions";
import { DiscountService } from "src/features/product/discount/discount.service";
import { messages } from "src/helpers/constants";
import { OrderDocument } from "../order.schema";
import { ProductDocument } from "src/features/product/product/product.schema";
import { Model } from "mongoose";
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Complex } from "src/features/complex/complex/complex.schema";
import { toObjectId } from "src/helpers/functions";
import { InjectModel } from "@nestjs/mongoose";
import { ComplexService } from "src/features/complex/complex/comlex.service";
import { RangeService } from "src/features/complex/range/range.service";
import { RangeDocument } from "src/features/complex/range/range.schema";

@Injectable()
export class OrderThirdMethodsService {
  constructor(
    @InjectModel("order")
    private readonly model: Model<OrderDocument>,
    private readonly productService: ProductFetchService,
    private readonly complexService: ComplexService,
    private readonly rangeService: RangeService,
    private readonly discountService: DiscountService
  ) {}

  async isValidCreateRequest() {
    const theComplex: Complex = await this.complexService.findTheComplex();
    if (!theComplex) throw new NotFoundException(messages[404]);
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

  async shippingRangeHandler(user_address?: {
    name: string;
    description: string;
    latitude: number;
    longitude: number;
  }) {
    let theRange: RangeDocument | null;
    if (user_address) {
      const { latitude, longitude } = user_address || {};
      if (!latitude || !longitude)
        throw new BadRequestException("مختصات جغرافیایی وارد نشده است.");
      else
        theRange = await this.rangeService.findCorrespondingRange({
          latitude: user_address.latitude,
          longitude: user_address.longitude,
        });

      if (!theRange)
        throw new ForbiddenException(
          "متاسفانه شما در محدوده ارسال مجموعه قرار ندارید."
        );
      return theRange;
    }
    return null;
  }

  async priceHandler(data: {
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
    const { complex_packing_price, products } = data;

    const complexDiscounts = await this.discountService.findAll();

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

  async productsPriceHandler(
    products: {
      product: ProductDocument;
      quantity: number;
      price: {
        amount: number;
        title: string;
        price_id: string;
      };
    }[]
  ) {
    const complexDiscounts = await this.discountService.findAll();

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
    return todayOrdersCount + 501;
  }
}
