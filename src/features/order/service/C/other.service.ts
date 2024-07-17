import { Injectable } from "@nestjs/common";
import { Model } from "mongoose";
import { OrderDocument } from "../../order.schema";
import { InjectModel } from "@nestjs/mongoose";
import { lastValueFrom } from "rxjs";
import { Cron, CronExpression } from "@nestjs/schedule";
import { HttpService } from "@nestjs/axios";
import { sofreBaseUrl } from "src/helpers/constants";

@Injectable()
export class OrderOtherCreateService {
  constructor(
    @InjectModel("order")
    private readonly model: Model<OrderDocument>,
    private readonly httpService: HttpService
  ) {}

  async newOrders() {
    const res = await lastValueFrom(
      this.httpService.get(
        `${sofreBaseUrl}/orders/last-added/${process.env.COMPLEX_ID}`
      )
    );
    const lastCreatedAt = new Date(res.data);
    const newOrders = await this.model
      .find({ created_at: { $gt: lastCreatedAt }, status: 5 })
      .lean()
      .exec();
    return newOrders;
  }

  async uploadOrders() {
    const newOrders = await this.newOrders();
    await lastValueFrom(
      this.httpService.post(
        `${sofreBaseUrl}/orders/offline`,
        {
          complex_id: process.env.COMPLEX_ID,
          orders: newOrders,
        },
        {
          headers: {
            "api-key": process.env.COMPLEX_TOKEN,
          },
        }
      )
    );
    return "success";
  }

  @Cron(CronExpression.EVERY_3_HOURS, {
    name: "complex-activation-cron",
    timeZone: "Asia/Tehran",
  })
  async handleCron() {
    await this.uploadOrders();
  }
}
