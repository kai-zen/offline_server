import { ComplexUserDocument } from "../complex-users.schema";
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, PipelineStage } from "mongoose";
import { toObjectId } from "src/helpers/functions";

@Injectable()
export class ComplexUsersFetchService {
  constructor(
    @InjectModel("complex-user")
    private readonly model: Model<ComplexUserDocument>
  ) {}

  async fetchComplexUsers(
    complex_id: string,
    queryParams: { [props: string]: string }
  ) {
    const {
      search = "",
      limit,
      page = "1",
      sort,
      direction = "asc",
      favorite_product,
    } = queryParams || {};

    const searchRegex = new RegExp(`^${search}`, "i");
    const applyingLimit = parseInt(limit) || 8;
    const sortObj = {};
    sortObj[sort || "created_at"] = direction === "asc" ? -1 : 1;

    const aggregateQuery: PipelineStage[] = [
      { $match: { complex: toObjectId(complex_id) } },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $match: {
          $or: [{ "user.mobile": searchRegex }, { "user.name": searchRegex }],
        },
      },
      { $unwind: "$products" },
      { $sort: { "products.iteration": -1 } },
      {
        $group: {
          _id: "$_id",
          user: { $first: "$user" },
          debt: { $first: "$debt" },
          orders: { $first: "$orders" },
          last_visit: { $first: "$last_visit" },
          favorite_product: { $first: "$products" },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "favorite_product.product",
          foreignField: "_id",
          as: "favorite_product_details",
        },
      },
      {
        $unwind: {
          path: "$favorite_product_details",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          last_visit: 1,
          debt: { $sum: "$debt.total" },
          favorite_product: {
            quantity: "$favorite_product.iteration",
            name: "$favorite_product_details.name",
            _id: "$favorite_product.product",
          },
          orders_count: { $size: "$orders" },
          total_spent: { $sum: "$orders.total" },
          "user.mobile": 1,
          "user.name": 1,
          "user._id": 1,
          "user.total_points": 1,
        },
      },
      { $sort: sortObj },
    ];

    if (favorite_product)
      aggregateQuery.push({
        $match: {
          "favorite_product._id": toObjectId(favorite_product),
        },
      });

    const [queryResult] =
      (await this.model.aggregate([
        ...aggregateQuery,
        {
          $facet: {
            results: [
              { $skip: (parseInt(page) - 1) * applyingLimit },
              { $limit: applyingLimit },
            ],
            totalDocuments: [
              {
                $count: "count",
              },
            ],
          },
        },
      ])) || [];
    if (!queryResult) throw new NotFoundException();
    const { results, totalDocuments } = queryResult;
    const numberOfPages = Math.ceil(totalDocuments?.[0]?.count / applyingLimit);

    return { items: results, numberOfPages };
  }

  async findByUserAndComplex(user_id: string, complex_id: string) {
    const aggregateResult = await this.model
      .aggregate([
        {
          $match: {
            $expr: {
              $and: [
                { user: toObjectId(user_id) },
                { complex: toObjectId(complex_id) },
              ],
            },
          },
        },
        { $limit: 1 },
        {
          $lookup: {
            from: "users",
            as: "user",
            localField: "user",
            foreignField: "_id",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$debt", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "orders",
            as: "debt",
            let: { order: "$debt.order" },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$order"] } } },
              { $limit: 1 },
              { $unwind: "$products" },
              {
                $lookup: {
                  from: "products",
                  localField: "products.product",
                  foreignField: "_id",
                  as: "product_details",
                },
              },
              { $unwind: "$product_details" },
              {
                $lookup: {
                  from: "users",
                  localField: "user",
                  foreignField: "_id",
                  as: "user",
                },
              },
              { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
              {
                $project: {
                  "products._id": "$product_details._id",
                  "products.quantity": 1,
                  "products.price": 1,
                  "products.name": "$product_details.name",
                  order_type: 1,
                  payment_type: 1,
                  needs_pack: 1,
                  description: 1,
                  complex_description: 1,
                  user: 1,
                  user_address: 1,
                  user_phone: 1,
                  shipping_price: 1,
                  packing_price: 1,
                  total_price: 1,
                  extra_price: 1,
                  complex_discount: 1,
                  user_discount: 1,
                  table_number: 1,
                  status: 1,
                  factor_number: 1,
                  tax: 1,
                  service: 1,
                  created_at: 1,
                },
              },
              {
                $group: {
                  _id: "$_id",
                  products: { $addToSet: "$products" },
                  order_type: { $first: "$order_type" },
                  payment_type: { $first: "$payment_type" },
                  needs_pack: { $first: "$needs_pack" },
                  description: { $first: "$description" },
                  complex_description: { $first: "$complex_description" },
                  user: { $first: "$user" },
                  user_address: { $first: "$user_address" },
                  user_phone: { $first: "$user_phone" },
                  shipping_price: { $first: "$shipping_price" },
                  packing_price: { $first: "$packing_price" },
                  total_price: { $first: "$total_price" },
                  extra_price: { $first: "$extra_price" },
                  complex_discount: { $first: "$complex_discount" },
                  user_discount: { $first: "$user_discount" },
                  table_number: { $first: "$table_number" },
                  status: { $first: "$status" },
                  factor_number: { $first: "$factor_number" },
                  tax: { $first: "$tax" },
                  service: { $first: "$service" },
                  created_at: { $first: "$created_at" },
                },
              },
            ],
          },
        },
        { $unwind: { path: "$debt", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: "$_id",
            user: { $first: "$user" },
            debt: { $addToSet: "$debt" },
            orders: { $first: "$orders" },
            last_visit: { $first: "$last_visit" },
            favorite_product: { $first: "$products" },
          },
        },
      ])
      .exec();
    return aggregateResult?.length > 0 ? aggregateResult[0] : null;
  }

  async findByUserAndComplexBrief(user_id: string, complex_id: string) {
    const result: ComplexUserDocument = await this.model.findOne({
      user: user_id,
      complex: complex_id,
    });
    if (!result) return { orders_quantity: 0, total_rates: 0, avg_rate: 0 };
    else {
      const rates = result.products.map((item) => item.rates).flat(1);
      const totalRates = rates.length;
      const totalPoints = rates.reduce(
        (accumulator, currentVal) => accumulator + currentVal,
        0
      );
      return {
        orders_quantity: result.orders.length,
        total_rates: totalRates,
        avg_rate: Number((totalPoints / totalRates).toFixed(1)) || 0,
      };
    }
  }
}
