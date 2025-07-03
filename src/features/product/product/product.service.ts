import { DiscountService } from "../discount/discount.service";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model } from "mongoose";
import { ProductDocument } from "./product.schema";
import { Injectable, NotFoundException } from "@nestjs/common";
import { addDiscountToProducts } from "./helpers/functions";
import { lastValueFrom } from "rxjs";
import { HttpService } from "@nestjs/axios";
import { messages, sofreBaseUrl } from "src/helpers/constants";
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
      .find({ is_archived: false, is_deleted: false })
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

  async findComplexProducts() {
    const results = await this.model
      .find({ is_archived: false, is_deleted: false })
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

  async pastDaysProductsStats(data: {
    complex_id: string;
    params: { [props: string]: string };
    days?: number;
  }) {
    const { complex_id, days, params } = data;
    const { limit, page = "1", from, to, cash_bank } = params || {};
    const applyingLimit = parseInt(limit) || 12;

    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
    const settingDate = new Date().getDate() - (days || 7);
    const settedDate = new Date().setDate(settingDate);
    const nDaysAgo = new Date(new Date(settedDate).setHours(0, 0, 0, 0));

    const firstFilters: FilterQuery<any> = days
      ? [{ $lt: ["$payed_at", startOfToday] }, { $gt: ["$payed_at", nDaysAgo] }]
      : to
        ? [
            { $lte: ["$payed_at", new Date(to)] },
            { $gte: ["$payed_at", new Date(from)] },
          ]
        : [{ $gte: ["$payed_at", new Date(from)] }];
    firstFilters.push({ complex: toObjectId(complex_id) });

    const secondFilters: FilterQuery<any> = [
      { $eq: ["$products.product", "$$productId"] },
      { $in: ["$status", [2, 3, 4, 5]] },
    ];
    if (cash_bank)
      secondFilters.push({ $eq: ["$cash_bank", toObjectId(cash_bank)] });

    const [queryResult] = await this.model.aggregate([
      { $match: { complex: toObjectId(complex_id) } },
      {
        $lookup: {
          from: "orders",
          let: { productId: "$_id" },
          pipeline: [
            { $match: { $expr: { $and: firstFilters } } },
            { $unwind: "$products" },
            { $match: { $expr: { $and: secondFilters } } },
          ],
          as: "relatedOrders",
        },
      },
      { $unwind: "$relatedOrders" },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          total_sale: { $sum: "$relatedOrders.products.quantity" },
        },
      },
      {
        $facet: {
          results: [
            { $sort: { name: 1 } },
            { $sort: { total_sale: -1 } },
            { $skip: (parseInt(page) - 1) * applyingLimit },
            { $limit: applyingLimit },
          ],
          totalDocuments: [{ $count: "count" }],
        },
      },
    ]);

    if (!queryResult) throw new NotFoundException(messages[404]);
    const { results, totalDocuments } = queryResult;
    const numberOfPages = Math.ceil(totalDocuments?.[0]?.count / applyingLimit);

    return { items: results, numberOfPages };
  }

  async updateData() {
    const res = await lastValueFrom(
      this.httpService.get(
        `${sofreBaseUrl}/product/localdb/${process.env.COMPLEX_ID}`,
        {
          headers: {
            "api-key": process.env.SECRET,
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
      await this.model.updateOne(
        { _id: modifiedResponse._id },
        { $set: modifiedResponse },
        { upsert: true }
      );
    }
  }
}

export default ProductService;
