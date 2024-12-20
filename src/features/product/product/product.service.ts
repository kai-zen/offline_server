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
import { ComplexService } from "src/features/complex/complex/comlex.service";

@Injectable()
export class ProductService {
  constructor(
    @InjectModel("product")
    private readonly model: Model<ProductDocument>,
    private readonly discountService: DiscountService,
    private readonly httpService: HttpService,
    private readonly complexService: ComplexService
  ) {}

  async findAll() {
    const results = await this.model
      .find({ is_archieved: false })
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
      .find({ is_archived: false })
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
    const { days, params } = data;
    const { limit, page = "1", from, to, cash_bank } = params || {};
    const applyingLimit = parseInt(limit) || 12;
    const theComplex = await this.complexService.findTheComplex();

    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
    const n = days || 7;
    const nDaysAgo = new Date(
      new Date().setDate(new Date().getDate() - n || 7)
    );

    let filters: any[] = [
      { $eq: ["$products.product", "$$productId"] },
      { $not: { $in: ["$status", [1, 6, 7]] } },
    ];
    if (days)
      filters = [
        { $eq: ["$products.product", "$$productId"] },
        { $lte: ["$payed_at", startOfToday] },
        { $gte: ["$payed_at", nDaysAgo] },
        { $not: { $in: ["$status", [1, 6, 7]] } },
      ];
    else {
      filters.push({
        $gte: ["$payed_at", new Date(from)],
      });
      if (to)
        filters.push({
          $lte: ["$payed_at", new Date(to)],
        });
      if (cash_bank)
        filters.push({ $eq: ["$cash_bank", toObjectId(cash_bank)] });
    }
    if (theComplex?.last_orders_update)
      filters.push({ $gt: ["$created_at", theComplex.last_orders_update] });

    const [queryResult] = await this.model.aggregate([
      { $match: { is_archieved: false } },
      {
        $lookup: {
          from: "orders",
          let: { productId: "$_id" },
          pipeline: [
            { $unwind: "$products" },
            { $match: { $expr: { $and: filters } } },
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
      { $sort: { total_sale: -1 } },
      {
        $facet: {
          results: [
            { $skip: (parseInt(page) - 1) * applyingLimit },
            { $limit: applyingLimit },
          ],
          totalDocuments: [{ $count: "count" }],
        },
      },
    ]);

    if (!queryResult) throw new NotFoundException();
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
