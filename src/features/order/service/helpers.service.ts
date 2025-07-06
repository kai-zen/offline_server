import { discountCalculator } from "src/features/product/product/helpers/functions";
import { DiscountService } from "src/features/product/discount/discount.service";
import { OrderDocument } from "../order.schema";
import { ProductDocument } from "src/features/product/product/product.schema";
import { Model, Types } from "mongoose";
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Complex } from "src/features/complex/complex/complex.schema";
import { getStartAndEndOfTheDay, toObjectId } from "src/helpers/functions";
import { InjectModel } from "@nestjs/mongoose";
import { ComplexService } from "src/features/complex/complex/comlex.service";
import ProductService from "src/features/product/product/product.service";
import { RangeService } from "src/features/complex/range/range.service";
import { RangeDocument } from "src/features/complex/range/range.schema";
import { OrderProductItemDataType } from "./C/by-emp.service";

@Injectable()
export class OrderThirdMethodsService {
  constructor(
    @InjectModel("order")
    private readonly model: Model<OrderDocument>,
    private readonly complexService: ComplexService,
    private readonly rangeService: RangeService,
    private readonly discountService: DiscountService,
    private readonly productService: ProductService
  ) {}

  async isValidCreateRequest() {
    const theComplex: Complex = await this.complexService.findTheComplex();
    if (!theComplex)
      throw new NotFoundException("مجموعه موردنظر شما پیدا نشد.");
    return theComplex;
  }

  async productDataHandler(products: OrderProductItemDataType[]) {
    const productsFullData: {
      product: ProductDocument;
      quantity: number;
      price: {
        amount: number;
        title: string;
        price_id: string;
      };
      desc?: string;
    }[] = [];
    for await (const product of products) {
      const { product_id, quantity, price_index, desc } = product || {};
      const fullData = await this.productService.findById(product_id);
      if (fullData && fullData.prices?.[price_index])
        productsFullData.push({
          product: fullData,
          quantity: quantity || 1,
          price: {
            amount: fullData.prices[price_index].price,
            title: fullData.prices[price_index].title, // @ts-ignore
            price_id: fullData.prices[price_index]._id,
          },
          desc,
        });
    }
    return productsFullData;
  }

  async shippingRangeHandler(data: {
    complex_id: string;
    user_address: {
      name: string;
      description: string;
      latitude: number;
      longitude: number;
    };
  }) {
    const { user_address, complex_id } = data;

    if (!complex_id || !user_address)
      throw new BadRequestException("اطلاعات وارد شده ناقص است.");

    let theRange: RangeDocument | null;
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

  async priceHandler(data: {
    complex_packing_price: number;
    products: {
      product: ProductDocument;
      quantity: number;
      price: {
        amount: number;
        title: string;
        price_id: string | Types.ObjectId;
      };
    }[];
  }) {
    const { complex_packing_price, products } = data;

    const complexDiscounts = await this.discountService.findAll();

    let products_price = 0;
    let packing_price = complex_packing_price || 0;
    let complex_discount = 0;

    (products || []).forEach((item) => {
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
    const { products } = data;

    const complexDiscounts = await this.discountService.findAll();

    let order_price = 0;
    let complex_discount = 0;
    let total_packing = 0;

    (products || []).forEach((item) => {
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
    const { end, start } = getStartAndEndOfTheDay();
    const todayOrdersCount = await this.model
      .find({
        $and: [
          { complex: toObjectId(complex_id) },
          {
            created_at: {
              $gte: start,
              $lte: end,
            },
          },
        ],
      })
      .countDocuments();
    return todayOrdersCount + Number(process.env.FIRST_RECEIPT || 500);
  }
}
