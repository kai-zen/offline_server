import { DiscountService } from "../discount/discount.service";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ProductDocument } from "./product.schema";
import { Injectable, NotFoundException } from "@nestjs/common";
import { addDiscountToProducts } from "./helpers/functions";
import { lastValueFrom } from "rxjs";
import { HttpService } from "@nestjs/axios";
import { sofreBaseUrl } from "src/helpers/constants";
import { toObjectId } from "src/helpers/functions";

@Injectable()
export class ProductService {
  constructor(
    @InjectModel("product")
    private readonly model: Model<ProductDocument>,
    private readonly discountService: DiscountService,
    private readonly httpService: HttpService
  ) {}

  async findAll() {
    const results = await this.model
      .find({})
      .populate(
        "complex",
        "image name min_online_ordering_price packing tax service"
      )
      .populate("folder")
      .lean()
      .exec();

    // add discount to products
    const currentDiscounts = await this.discountService.findAll();
    const productsWithDiscount = addDiscountToProducts(
      results,
      currentDiscounts
    );
    return productsWithDiscount;
  }

  async findById(id: string) {
    return await this.model
      .findById(id)
      .populate("folder")
      .populate("complex")
      .exec();
  }

  async findPrice(productId: string, priceId: string) {
    const theProduct = await this.model.findById(productId).lean().exec();
    if (!theProduct) throw new NotFoundException("محصول پیدا نشد.");
    // @ts-ignore
    return theProduct.prices.find((p) => p._id.toString() === priceId)?.price;
  }

  async updateData() {
    const res = await lastValueFrom(
      this.httpService.get(
        `${sofreBaseUrl}/product/localdb/${process.env.COMPLEX_ID}`,
        {
          headers: {
            "api-key": process.env.COMPLEX_TOKEN,
          },
        }
      )
    );
    for await (const record of res.data) {
      const pricesObjectIds = record.prices.map((p) => ({
        ...p,
        _id: toObjectId(p._id),
      }));
      const modifiedResponse = {
        ...record,
        prices: pricesObjectIds,
        folder: toObjectId(record.folder),
        _id: toObjectId(record._id),
        complex: toObjectId(record.complex),
      };
      await this.model.updateMany(
        { _id: modifiedResponse._id },
        { $set: modifiedResponse },
        { upsert: true }
      );
    }
  }
}

export default ProductService;
