import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { OrderDocument } from "../../order.schema";
import { productDataFormatter } from "../../helpers/functions";
import { CashBankService } from "src/features/complex/cash-bank/cash-bank.service";
import { messages } from "src/helpers/constants";
import { toObjectId } from "src/helpers/functions";

@Injectable()
export class OrderFetchService {
  constructor(
    @InjectModel("order")
    private readonly model: Model<OrderDocument>,
    private readonly cashbankService: CashBankService
  ) {}

  async findAll(queryParams: { [props: string]: string }) {
    const { limit = "12", page = "1" } = queryParams || {};
    const results = await this.model
      .find({})
      .sort({ created_at: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate("products.product")
      .populate("complex")
      .populate("user")
      .lean()
      .exec();

    const totalDocuments = await this.model.countDocuments({});
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
        complex: toObjectId(complex_id),
        cash_bank: toObjectId(cash_bank),
        payed_at: { $gte: new Date(theCashbank.last_print) },
      },
    ];

    const results = await this.model
      .find({ $and: filters })
      .sort({ created_at: -1 })
      .populate("products.product")
      .populate("submitter")
      .populate("user")
      .populate("cash_bank", "-complex")
      .select("-complex")
      .lean()
      .exec();

    return productDataFormatter(results);
  }

  async findComplexLiveOrders() {
    const results = await this.model
      .find({ is_uploaded: false, status: { $lt: 5 } })
      .sort({ created_at: -1 })
      .populate("products.product")
      .populate("delivery_guy")
      .populate("user")
      .lean()
      .exec();
    return productDataFormatter(results);
  }

  async financeReport(data: {
    complex_id: string;
    start: string | Date;
    end?: string | Date;
    cash_bank?: string;
  }) {
    const { complex_id, end, start, cash_bank } = data;
    const startDate = new Date(start);

    const endDate = end
      ? new Date(end)
      : new Date(new Date().setHours(23, 59, 59, 999));

    const filters: any[] = [
      { complex: toObjectId(complex_id) },
      { status: { $nin: [6, 7] } },
      {
        payed_at: {
          $lte: endDate || new Date(),
          $gte: startDate,
        },
      },
    ];
    if (cash_bank) filters.push({ cash_bank: toObjectId(cash_bank) });

    const results: {
      _id: number;
      quantity: number;
      total_discount: number;
      total_shipping: number;
      total_tips: number;
      amount: number;
    }[] = await this.model
      .aggregate([
        { $match: { $and: filters } },
        { $unwind: "$payments" },
        {
          $group: {
            _id: "$payments.type",
            quantity: { $sum: 1 },
            total_discount: { $sum: "$user_discount" },
            total_shipping: { $sum: "$shipping_price" },
            total_tips: { $sum: "$tip" },
            amount: { $sum: "$payments.amount" },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .exec();
    return results;
  }

  // ( next methods are from stats service in online server)
  async orderCountReport(data: {
    complex_id: string;
    start: string | Date;
    end?: string | Date;
    cash_bank?: string;
  }) {
    const { complex_id, end, start, cash_bank } = data;
    const startDate = new Date(start);

    const endDate = end
      ? new Date(end)
      : new Date(new Date().setHours(23, 59, 59, 999));
    const filters: any[] = [
      { complex: toObjectId(complex_id) },
      { status: { $nin: [6, 7] } },
      {
        payed_at: {
          $lte: endDate || new Date(),
          $gte: startDate,
        },
      },
    ];
    if (cash_bank) filters.push({ cash_bank: toObjectId(cash_bank) });
    return await this.model.countDocuments({ $and: filters });
  }

  async orderCrowdedTimes(complex_id: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 42);

    const complexId = toObjectId(complex_id);
    if (!complexId) throw new BadRequestException(messages[400]);

    return await this.model.aggregate([
      {
        $match: {
          status: 5,
          created_at: { $gte: thirtyDaysAgo },
          complex: complexId,
        },
      },
      {
        $addFields: {
          localTime: {
            $dateToString: {
              format: "%H",
              date: "$created_at",
              timezone: "Asia/Tehran",
            },
          },
          localWeekDay: {
            $dateToString: {
              format: "%u",
              date: "$created_at",
              timezone: "Asia/Tehran",
            },
          },
        },
      },
      {
        $facet: {
          hourlyCounts: [
            { $group: { _id: "$localTime", count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, hour: "$_id", orders: "$count" } },
          ],
          weekdayCounts: [
            {
              $group: {
                _id: "$localWeekDay",
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, dayOfWeek: "$_id", orders: "$count" } },
          ],
        },
      },
    ]);
  }
}
