import {
  Inject,
  Injectable,
  NotFoundException,
  Scope,
  forwardRef,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { REQUEST } from "@nestjs/core";
import { Request } from "express";
import { toObjectId } from "src/helpers/functions";
import { messages } from "src/helpers/constants";
import { CashBankService } from "src/features/complex/cash-bank/cash-bank.service";
import { OrderDocument } from "../../order.schema";
import { productDataFormatter } from "../../helpers/functions";
import {
  userOrderCommentsLookup,
  userOrderComplexLookup,
  userOrderGroup,
  userOrderProject,
} from "src/helpers/aggregate-constants";
import { ShiftDocument } from "src/features/complex/shift/shift.schema";
import { AccessService } from "src/features/user/access/access.service";

@Injectable({ scope: Scope.REQUEST })
export class OrderFetchService {
  constructor(
    @InjectModel("order")
    private readonly model: Model<OrderDocument>,
    @Inject(REQUEST)
    private req: Request,
    @Inject(forwardRef(() => CashBankService))
    private readonly cashbankService: CashBankService,
    private readonly accessService: AccessService
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
      search,
      payment,
      type,
      from,
      to,
      delivery_guy,
      orderType,
      // isPending,
    } = queryParams || {};

    const filters: any[] = [{ complex: complex_id }];
    if (status && !isNaN(Number(status)))
      filters.push({ status: Number(status) });
    if (payment) filters.push({ payment_type: Number(payment) });
    if (orderType)
      filters.push({ order_type: type === "1" ? 1 : type === "2" ? 2 : 3 });
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
    if (search) filters.push({ user_phone: { $regex: search } });
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

  async findCashbankOrders(complex_id: string, cash_bank: string) {
    const theCashbank = await this.cashbankService.findById(cash_bank);
    if (!theCashbank) throw new NotFoundException(messages[404]);

    const filters: any[] = [
      {
        complex: complex_id,
        cash_bank: cash_bank,
        payed_at: { $gte: new Date(theCashbank.last_print) },
      },
    ];

    const results = await this.model
      .find({ $and: filters })
      .sort({ created_at: -1 })
      .populate("products.product")
      .populate("user")
      .populate("cash_bank", "-complex")
      .select("-complex")
      .lean()
      .exec();

    return productDataFormatter(results);
  }

  async findShiftOrders(
    shift: ShiftDocument,
    queryParams: { [props: string]: string }
  ) {
    const { limit = "12", page = "1" } = queryParams || {};
    const filters: any[] = [
      {
        complex: shift.complex._id,
        cash_bank: shift.cashbank._id,
        payed_at: { $gte: shift.start, $lte: shift.end },
      },
    ];

    const results = await this.model
      .find({ $and: filters })
      .sort({ created_at: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate("products.product")
      .populate("user")
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

  async findShiftDeliveryGuysReport(shift: ShiftDocument) {
    const deliveryGuys = await this.accessService.findDeliveryGuys(
      shift.complex._id
    );

    const formattedData: any[] = [];
    for await (const dg of deliveryGuys) {
      const orders = await this.model
        .find({
          $and: [
            { complex: shift.complex._id },
            { cash_bank: shift.cashbank._id },
            { payed_at: { $gte: shift.start, $lte: shift.end } },
            { delivery_guy: dg._id },
          ],
        })
        .lean()
        .exec();

      const total_count = orders.length;
      const total_shipping_price = orders
        .map((o) => o.shipping_price)
        .reduce((accumulator, currentVal) => accumulator + currentVal, 0);

      formattedData.push({
        ...dg,
        total_count,
        total_shipping_price,
      });
    }

    return formattedData;
  }

  async findComplexLiveOrders(complex_id: string) {
    const filters: any[] = [
      { complex: complex_id },
      { status: { $in: [1, 2, 3, 4] } },
      {
        $or: [
          { table_number: { $nin: [null, undefined] } },
          { order_type: { $in: [1, 2] } },
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
    if (!queryResult) throw new NotFoundException(messages[404]);
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

  async findDetails(id: string, complex_id: string) {
    return await this.model
      .findOne({
        _id: toObjectId(id),
        complex: toObjectId(complex_id),
        status: { $in: [2, 3, 4, 5] },
      })
      .populate("products.product")
      .select("-user_phone -user_address -user -complex_user")
      .exec();
  }

  async todayCount(complex_id: string) {
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
    return todayOrdersCount;
  }
}
