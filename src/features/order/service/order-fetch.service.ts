import {
  Inject,
  Injectable,
  NotFoundException,
  Scope,
  forwardRef,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { OrderDocument } from "../order.schema";
import { productDataFormatter } from "../helpers/functions";
import { REQUEST } from "@nestjs/core";
import { Request } from "express";
import { toObjectId } from "src/helpers/functions";
import {
  userOrderGroup,
  userOrderCommentsLookup,
  userOrderProject,
  userOrderComplexLookup,
} from "../helpers/aggregate-constants";
import { messages } from "src/helpers/constants";
import { CashBankService } from "src/features/complex/cash-bank/cash-bank.service";

@Injectable({ scope: Scope.REQUEST })
export class OrderFetchService {
  constructor(
    @InjectModel("order")
    private readonly model: Model<OrderDocument>,
    @Inject(REQUEST)
    private req: Request,
    @Inject(forwardRef(() => CashBankService))
    private readonly cashbankService: CashBankService
  ) {}

  async findAll(queryParams: { [props: string]: string }) {
    const { limit = "12", page = "1" } = queryParams || {};
    const results = await this.model
      .find()
      .sort({ created_at: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate("products.product")
      .populate("complex")
      .populate("user")
      .lean()
      .exec();

    const totalDocuments = await this.model.find().countDocuments().exec();
    const numberOfPages = Math.ceil(totalDocuments / parseInt(limit));

    return {
      items: productDataFormatter(results),
      numberOfPages,
    };
  }

  async findComplexOrders(
    complex_id: string,
    queryParams: { [props: string]: string }
  ) {
    const {
      limit = "12",
      page = "1",
      status,
      shipping,
      search,
      payment,
      type,
      from,
      to,
      delivery_guy,
      // isPending,
    } = queryParams || {};

    const filters: any[] = [{ complex: complex_id }];
    if (status && !isNaN(Number(status)))
      filters.push({ status: Number(status) });
    if (shipping) filters.push({ shipping_type: shipping === "2" ? 2 : 1 });
    if (payment) filters.push({ payment_type: payment === "2" ? 2 : 1 });
    if (type)
      filters.push({
        order_type: type === "1" ? 1 : type === "2" ? 2 : 3,
      });
    if (from)
      filters.push({
        created_at: { $gt: new Date(from).setHours(0, 0, 0, 0) },
      });
    if (to)
      filters.push({
        created_at: { $lt: new Date(to).setHours(23, 59, 59, 999) },
      });
    if (search) {
      const searchRegex = new RegExp(`^${search}`, "i");
      filters.push({ user_phone: searchRegex });
    }
    if (delivery_guy) filters.push({ delivery_guy });

    // if (isPending) applyingFilters.push({ status: { $in: [1, 2, 3] } });

    const results = await this.model
      .find({ $and: filters })
      .sort({ created_at: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate("products.product")
      .populate("user")
      .populate("cash_bank", "-complex")
      .select("-complex")
      .lean()
      .exec();

    const totalDocuments = await this.model
      .find({ $and: filters })
      .countDocuments()
      .exec();
    const numberOfPages = Math.ceil(totalDocuments / parseInt(limit));

    return {
      items: productDataFormatter(results),
      numberOfPages,
    };
  }

  async findCashbankOrders(
    complex_id: string,
    cash_bank: string,
    queryParams: { [props: string]: string }
  ) {
    const { limit = "12", page = "1" } = queryParams || {};

    const theCashbank = await this.cashbankService.findById(
      cash_bank,
      complex_id
    );
    if (!theCashbank) throw new NotFoundException(messages[404]);

    const filters: any[] = [
      {
        complex: complex_id,
        cash_bank: cash_bank,
        created_at: { $gte: new Date(theCashbank.last_print) },
      },
    ];

    const results = await this.model
      .find({ $and: filters })
      .sort({ created_at: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate("products.product")
      .populate("user")
      .populate("cash_bank", "-complex")
      .select("-complex")
      .lean()
      .exec();

    const totalDocuments = await this.model
      .find({ $and: filters })
      .countDocuments()
      .exec();
    const numberOfPages = Math.ceil(totalDocuments / parseInt(limit));

    return {
      items: productDataFormatter(results),
      numberOfPages,
    };
  }

  async findComplexLiveOrders(complex_id: string) {
    const filters: any[] = [
      { complex: complex_id },
      { status: { $in: [1, 2, 3, 4] } },
      {
        $or: [
          { table_number: { $nin: [null, undefined] } },
          { order_type: { $in: [2, 3] } },
          { payment_type: { $gt: 1 } },
        ],
      },
    ];
    const results = await this.model
      .find({ $and: filters })
      .sort({ created_at: -1 })
      .populate("products.product")
      .populate("delivery_guy", "-complex -type")
      .populate("user")
      .populate("cash_bank")
      .select("-complex")
      .lean()
      .exec();
    return productDataFormatter(results);
  }

  async findUserOrders(
    queryParams: { [props: string]: string },
    complex_id?: string
  ) {
    const { limit, page = "1" } = queryParams || {};
    const applyingLimit = parseInt(limit) || 12;
    const userId = this.req.currentUser._id;

    const filters = complex_id
      ? { $and: [{ user: userId }, { complex: toObjectId(complex_id) }] }
      : { user: userId };

    const [queryResult] =
      (await this.model.aggregate([
        { $match: filters },
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
        { $project: userOrderProject },
        { $group: userOrderGroup },
        { $lookup: userOrderComplexLookup },
        { $unwind: "$complex" },
        { $lookup: userOrderCommentsLookup },
        { $unwind: { path: "$comment", preserveNullAndEmptyArrays: true } },
        { $sort: { created_at: -1 } },
        {
          $facet: {
            results: [
              { $skip: (parseInt(page) - 1) * applyingLimit },
              { $limit: applyingLimit },
            ],
            totalDocuments: [{ $count: "count" }],
          },
        },
      ])) || [];
    if (!queryResult) throw new NotFoundException();
    const { results, totalDocuments } = queryResult;
    const numberOfPages = Math.ceil(totalDocuments?.[0]?.count / applyingLimit);

    return { items: results, numberOfPages };
  }

  async findById(id: string) {
    return await this.model
      .findById(id)
      .populate("products.product")
      .populate("complex")
      .populate("user")
      .exec();
  }
}
