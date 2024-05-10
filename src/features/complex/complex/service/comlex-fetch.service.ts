import { ComplexDocument } from "../complex.schema";
import { InjectModel } from "@nestjs/mongoose";
import { messages } from "src/helpers/constants";
import { Model, PipelineStage, Types } from "mongoose";
import { toObjectId } from "src/helpers/functions";
import {
  categoryLookup,
  cityLookup,
  listResultProject,
  maxDiscountCalculator,
  promotedProductsLookup,
  reserveSettingsLookup,
  singleResultProject,
  socialsLookup,
  tagsLookup,
  worktimesLookup,
} from "../helpers/aggregates";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

@Injectable()
export class ComplexFetchService {
  constructor(
    @InjectModel("complex")
    private readonly model: Model<ComplexDocument>
  ) {}

  async findAllIDs() {
    return this.model.find().select("username").exec();
  }

  async findAll(queryParams: { [props: string]: string }) {
    const {
      search = "",
      limit = "12",
      page = "1",
      sort,
      direction = "asc",
    } = queryParams || {};

    const sortObj = {};
    if (sort) sortObj[sort] = direction === "asc" ? -1 : 1;
    const searchRegex = new RegExp(`^${search}`, "i");

    const results = await this.model
      .find({ name: searchRegex })
      .sort(sortObj)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate("category")
      .populate("address.city")
      .populate("owner")
      .exec();

    const totalDocuments = await this.model
      .find({ name: searchRegex })
      .countDocuments()
      .exec();
    const numberOfPages = Math.ceil(totalDocuments / parseInt(limit));

    return {
      items: results,
      numberOfPages,
    };
  }

  async findByLocation(queryParams: { [props: string]: string }) {
    const {
      lat,
      lng,
      city,
      limit = "12",
      page = "1",
      sort,
      direction = "asc",
      search,
      in_range,
    } = queryParams || {};
    const applyingLimit = parseInt(limit) || 12;
    const sortObj = {}; // distance - created_at - total_points - average_points
    if (sort) sortObj[sort] = direction === "asc" ? -1 : 1;
    else sortObj["total_points"] = -1;

    if (!city)
      throw new BadRequestException(
        "پیش از دریافت لیست مجموعه ها لازم است موقعیتتان را مشخص کنید."
      );

    const applyingFilters: any = [
      { "address.city": toObjectId(city) },
      { is_active: true },
    ];
    if (search) {
      const searchRegex = new RegExp(`^${search}`, "i");
      applyingFilters.push({ name: searchRegex });
    }
    if (in_range) applyingFilters.push({ distance: { $lte: "$max_range" } });

    const geoNearStage: PipelineStage = {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [parseFloat(lng || "0"), parseFloat(lat || "0")],
        },
        distanceField: "distance",
        spherical: true,
      },
    };

    const [queryResult] = await this.model.aggregate([
      ...(lat && lng ? [geoNearStage] : []),
      { $match: { $and: applyingFilters } },
      ...maxDiscountCalculator,
      ...worktimesLookup,
      ...categoryLookup,
      promotedProductsLookup,
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
      listResultProject,
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

  async findByTags(queryParams: { [props: string]: string }) {
    const { city, limit = "12", page = "1", tags } = queryParams || {};
    const tagsIDs = tags.split(",").map((item) => toObjectId(item));
    const applyingLimit = parseInt(limit) || 12;

    if (!city)
      throw new BadRequestException(
        "پیش از دریافت لیست مجموعه ها لازم است موقعیتتان را مشخص کنید."
      );

    const [queryResult] = await this.model.aggregate([
      {
        $match: {
          $and: [{ "address.city": toObjectId(city) }, { is_active: true }],
        },
      },
      ...maxDiscountCalculator,
      ...worktimesLookup,
      ...categoryLookup,
      promotedProductsLookup,
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
      {
        $project: {
          _id: 0,
          username: 1,
          name: 1,
          image: 1,
          category: 1,
          total_comments: 1,
          average_points: 1,
          promoted_products: 1,
          is_active: 1,
          has_reserve: 1,
          has_sale: 1,
          worktime: { $ifNull: ["$work-time.today", []] },
          discount: { $ifNull: ["$max_discount.percent", 0] },
          tags: 1,
          common_tags: {
            $setInterserction: ["$tags", tagsIDs],
          },
        },
      },
      {
        $addFields: {
          common_tags_count: {
            $size: "$common_tags",
          },
        },
      },
      { $match: { common_tags_count: { $gt: 0 } } },
      { $sort: { common_tags_count: -1 } },
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

  async findById(id: string, is_user_name?: boolean) {
    const [result] = await this.model.aggregate([
      {
        $match: is_user_name ? { username: id } : { _id: toObjectId(id) },
      },
      ...categoryLookup,
      ...cityLookup,
      ...worktimesLookup,
      ...reserveSettingsLookup,
      socialsLookup,
      promotedProductsLookup,
      tagsLookup,
      singleResultProject,
    ]);
    if (!result) throw new NotFoundException("مجموعه مورد نظر پیدا نشد");
    return result;
  }

  async findByDomain(domain: string) {
    const [result] = await this.model.aggregate([
      { $match: { domain } },
      ...categoryLookup,
      ...cityLookup,
      ...worktimesLookup,
      ...reserveSettingsLookup,
      socialsLookup,
      promotedProductsLookup,
      tagsLookup,
      singleResultProject,
    ]);
    if (!result) throw new NotFoundException("مجموعه مورد نظر پیدا نشد");
    else return result;
  }

  async sitemapByDomain(domain: string) {
    const [result] = await this.model.aggregate([
      { $match: { domain } },
      {
        $lookup: {
          from: "products",
          as: "products",
          localField: "_id",
          foreignField: "complex",
        },
      },
      {
        $lookup: {
          from: "posts",
          as: "posts",
          localField: "_id",
          foreignField: "complex",
        },
      },
    ]);
    if (!result) throw new NotFoundException("مجموعه مورد نظر پیدا نشد");
    const productIds = result.products.map((item: any) => item._id);
    const postIds = result.products.map((item: any) => item._id);
    return { posts: postIds, products: productIds };
  }

  async financeData(complex_id: string) {
    const theComplex = await this.model.findById(complex_id);
    if (!theComplex) throw new NotFoundException(messages[404]);
    return {
      balance: theComplex.balance,
      sms_budget: theComplex.sms_budget,
      gateway: theComplex.gateway?.gate_id,
      expiration_date: theComplex.expiration_date,
    };
  }

  async findByUsername(username: string) {
    return await this.model.findOne({ username });
  }

  async isOwner(user_id: string | Types.ObjectId, complex_id: string) {
    return await this.model.exists({ _id: complex_id, owner: user_id });
  }
}
