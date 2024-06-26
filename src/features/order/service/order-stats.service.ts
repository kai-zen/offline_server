import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { OrderDocument } from "../order.schema";
import { toObjectId } from "src/helpers/functions";

@Injectable()
export class OrderStatsService {
  constructor(
    @InjectModel("order")
    private readonly model: Model<OrderDocument>
  ) {}

  async todayStats(complex_id: string) {
    const results = await this.model
      .find({
        $and: [
          { complex: toObjectId(complex_id) },
          {
            created_at: {
              $gte: new Date().setHours(0, 0, 0, 0),
              $lte: new Date().setHours(23, 59, 59, 999),
            },
          },
          { status: { $nin: [6, 7] } },
        ],
      })
      .lean()
      .exec();

    let total_income = 0;
    results.forEach((item) => (total_income += item.total_price));
    return { quantity: results.length || 0, total_income };
  }

  async pastDaysStats(complex_id: string, howManyDays: number) {
    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
    const n = howManyDays || 7;
    const nDaysAgo = new Date(
      new Date().setDate(new Date(new Date()).getDate() - n)
    );
    nDaysAgo.setHours(0, 0, 0, 0);

    const results = await this.model
      .find({
        $and: [
          { complex: toObjectId(complex_id) },
          {
            created_at: {
              $lte: startOfToday,
              $gte: nDaysAgo,
            },
          },
          { status: { $nin: [6, 7] } },
        ],
      })
      .lean()
      .exec();

    const result = [
      { quantity: 0, income: 0 },
      { quantity: 0, income: 0 },
      { quantity: 0, income: 0 },
    ];
    results.forEach((item) => {
      const relatedItem = result[item.order_type - 1];
      if (relatedItem) {
        relatedItem.quantity++;
        relatedItem.income += item.total_price;
      }
    });
    return result;
  }

  async pastDaysQuantity(complex_id: string, howManyDays: number) {
    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
    const n = howManyDays || 7;
    const nDaysAgo = new Date(new Date().setDate(new Date().getDate() - n));

    const results = await this.model
      .aggregate([
        {
          $match: {
            $and: [
              { complex: toObjectId(complex_id) },
              {
                created_at: {
                  $lte: startOfToday,
                  $gte: nDaysAgo,
                },
              },
              { status: { $nin: [6, 7] } },
            ],
          },
        },
        {
          $project: {
            day: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$created_at",
              },
            },
          },
        },
        { $group: { _id: "$day", quantity: { $sum: 1 } } },
        { $sort: { _id: -1 } },
      ])
      .exec();

    const quantities = new Array(n).fill(0);
    results.forEach((result) => {
      const howManyDaysFromNow = Math.floor(
        (startOfToday.getTime() - new Date(result._id).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      quantities[howManyDaysFromNow] = result.quantity;
    });

    return quantities;
  }

  async hasOpenOrders(complexId: string) {
    return await this.model.exists({
      complex: toObjectId(complexId),
      status: { $nin: [1, 6, 7] },
      payment_type: 1,
      on_hold: false,
    });
  }

  async financeReport(data: {
    complex_id: string;
    start: string;
    end?: string;
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
      { payment_type: { $gt: 1 } },
      {
        created_at: {
          $lte: endDate || new Date(),
          $gte: startDate,
        },
      },
    ];

    if (cash_bank) filters.push({ cash_bank: toObjectId(cash_bank) });

    const results = await this.model
      .aggregate([
        { $match: { $and: filters } },
        {
          $group: {
            _id: "$payment_type",
            quantity: { $sum: 1 },
            amount: { $sum: "$total_price" },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .exec();
    return results;
  }
}
