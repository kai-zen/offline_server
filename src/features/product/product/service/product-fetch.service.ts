import { addDiscountToProducts } from "../helpers/functions";
import { DiscountService } from "../../discount/discount.service";
import { InjectModel } from "@nestjs/mongoose";
import { messages } from "src/helpers/constants";
import { Model, Types } from "mongoose";
import { ProductDocument } from "../product.schema";
import { toObjectId } from "src/helpers/functions";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

@Injectable()
export class ProductFetchService {
  constructor(
    @InjectModel("product")
    private readonly model: Model<ProductDocument>,
    private readonly discountService: DiscountService
  ) {}

  async findAll(queryParams: { [props: string]: string }) {
    const {
      limit = "12",
      page = "1",
      search,
      city,
      category,
      sort,
      direction,
    } = queryParams || {};

    const applyingFilters: any = [];
    const applyingLimit = parseInt(limit) || 12;
    const sortObj = {}; //  total_points, average_points, created_at
    if (sort) sortObj[sort] = direction === "asc" ? -1 : 1;
    else sortObj["created_at"] = -1;

    if (search) {
      const searchRegex = new RegExp(`^${search}`, "i");
      applyingFilters.push({ name: searchRegex });
    }
    if (category) applyingFilters.push({ category: toObjectId(category) });
    if (city)
      applyingFilters.push({ "complex.address.city": toObjectId(city) });

    const [queryResult] = await this.model.aggregate([
      {
        $lookup: {
          from: "complexes",
          as: "complex",
          localField: "complex",
          foreignField: "_id",
        },
      },
      { $unwind: "$complex" },
      {
        $lookup: {
          from: "product-categories",
          as: "category",
          localField: "category",
          foreignField: "_id",
        },
      },
      { $unwind: "$category" },
      ...(applyingFilters.length
        ? [{ $match: { $and: applyingFilters } }]
        : []),
      {
        $addFields: {
          average_points: {
            $cond: [
              { $eq: ["$total_comments", 0] },
              0,
              { $divide: ["$total_points", "$total_comments"] },
            ],
          },
        },
      },
      { $sort: sortObj },
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

    if (!queryResult) throw new NotFoundException(messages[404]);
    const { results, totalDocuments } = queryResult;
    const numberOfPages = Math.ceil(totalDocuments?.[0]?.count / applyingLimit);

    return { items: results, numberOfPages };
  }

  async findByLocation(queryParams: { [props: string]: string }) {
    const {
      limit = "12",
      page = "1",
      search,
      city,
      category,
      sort,
      direction,
    } = queryParams || {};

    if (!city)
      throw new BadRequestException(
        "پیش از دریافت لیست محصولات لازم است موقعیتتان را مشخص کنید."
      );

    const applyingFilters: any = [
      { $expr: { $gt: [{ $size: "$images" }, 0] } },
      { is_active: true },
    ];
    const applyingLimit = parseInt(limit) || 12;
    const sortObj = {}; //  total_points, average_points, created_at
    if (sort) sortObj[sort] = direction === "asc" ? -1 : 1;
    else sortObj["distance"] = -1;

    if (search) {
      const searchRegex = new RegExp(`^${search}`, "i");
      applyingFilters.push({ name: searchRegex });
    }
    if (category) applyingFilters.push({ category: toObjectId(category) });

    const [queryResult] = await this.model.aggregate([
      {
        $lookup: {
          from: "complexes",
          as: "complex",
          let: { complex: "$complex" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$_id", "$$complex"] },
                    { $eq: ["$is_active", true] },
                    { $eq: ["$address.city", toObjectId(city)] },
                  ],
                },
              },
            },
            {
              $project: {
                _id: 1,
                name: 1,
                image: 1,
                username: 1,
              },
            },
          ],
        },
      },
      { $unwind: "$complex" },
      { $match: { $and: applyingFilters } },
      {
        $addFields: {
          average_points: {
            $cond: [
              { $eq: ["$total_comments", 0] },
              0,
              { $divide: ["$total_points", "$total_comments"] },
            ],
          },
        },
      },
      { $sort: sortObj },
      {
        $project: {
          name: 1,
          images: 1,
          complex_id: { $ifNull: ["$complex.username", "$complex._id"] },
          complex_name: "$complex.name",
          average_points: 1,
          total_comments: 1,
        },
      },
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

    if (!queryResult) throw new NotFoundException(messages[404]);
    const { results, totalDocuments } = queryResult;
    const numberOfPages = Math.ceil(totalDocuments?.[0]?.count / applyingLimit);

    return { items: results, numberOfPages };
  }

  async findComplexProducts(complex_id: string) {
    const results = await this.model
      .find({ complex: complex_id })
      .populate("category")
      .populate(
        "complex",
        "image name min_online_ordering_price packing tax service"
      )
      .populate("folder")
      .lean()
      .exec();

    // add discount to products
    const currentDiscounts =
      await this.discountService.findAllActiveComplexDiscounts(complex_id);
    const productsWithDiscount = addDiscountToProducts(
      results,
      currentDiscounts
    );
    return productsWithDiscount;
  }

  async findComplexProductCategories(complex_id: string) {
    const results = await this.model
      .find({ complex: complex_id })
      .populate("category")
      .lean()
      .exec();

    const categories = [];
    results.forEach((item) => {
      const doesItExist =
        categories.findIndex(
          (cat) => cat.id === item.category._id.toString()
        ) !== -1;
      if (!doesItExist) categories.push(item.category);
    });
    return categories;
  }

  async findProductsGroup(
    complex_id: string | Types.ObjectId,
    ids: (string | Types.ObjectId)[]
  ) {
    const results = await this.model
      .find({ _id: { $in: ids } })
      .populate("category")
      .populate("folder")
      .lean()
      .exec();

    // add discount to products
    const currentDiscounts =
      await this.discountService.findAllActiveComplexDiscounts(
        complex_id.toString()
      );
    const productsWithDiscount = addDiscountToProducts(
      results,
      currentDiscounts
    );
    return productsWithDiscount;
  }

  async findById(id: string) {
    return await this.model
      .findById(id)
      .populate("category", "-parent")
      .populate("folder", "-category")
      .populate("complex", "name image packing min_online_ordering_price")
      .exec();
  }

  async findPrice(productId: string, priceId: string) {
    const theProduct = await this.model.findById(productId).lean().exec();
    if (!theProduct) throw new NotFoundException("محصول پیدا نشد.");
    // @ts-ignore
    return theProduct.prices.find((p) => p._id.toString() === priceId)?.price;
  }

  async unableProducts(complex_id: string) {
    const results = await this.model
      .find({ complex: complex_id })
      .find({ $or: [{ has_stock: false }, { is_active: false }] })
      .select("_id")
      .lean()
      .exec();
    return results.map((item) => item._id);
  }

  async pastDaysProductsStats(data: {
    complex_id: string;
    params: { [props: string]: string };
    days?: number;
  }) {
    const { complex_id, days, params } = data;
    const { limit, page = "1", from, to } = params || {};
    const applyingLimit = parseInt(limit) || 12;

    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
    const n = days || 7;
    const nDaysAgo = new Date(
      new Date().setDate(new Date().getDate() - n || 7)
    );

    let filters: any[] = [{ $eq: ["$products.product", "$$productId"] }];
    if (days)
      filters = [
        { $eq: ["$products.product", "$$productId"] },
        { $lte: ["$created_at", startOfToday] },
        { $gte: ["$created_at", nDaysAgo] },
      ];
    else {
      filters.push({
        $gte: ["$created_at", new Date(from)],
      });
      if (to)
        filters.push({
          $lte: ["$created_at", new Date(to)],
        });
    }

    const [queryResult] = await this.model.aggregate([
      { $match: { complex: toObjectId(complex_id) } },
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
}

export default ProductFetchService;
