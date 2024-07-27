import { Injectable } from "@nestjs/common";
import { Model } from "mongoose";
import { OrderDocument } from "../../order.schema";
import { InjectModel } from "@nestjs/mongoose";
import { lastValueFrom } from "rxjs";
import { Cron, CronExpression } from "@nestjs/schedule";
import { HttpService } from "@nestjs/axios";
import { sofreBaseUrl } from "src/helpers/constants";
import { ComplexService } from "src/features/complex/complex/comlex.service";

@Injectable()
export class OrderOtherCreateService {
  constructor(
    @InjectModel("order")
    private readonly model: Model<OrderDocument>,
    private readonly complexService: ComplexService,
    private readonly httpService: HttpService
  ) {}

  async newOrders() {
    const theComplex = await this.complexService.findTheComplex();
    const lastCreatedAt = theComplex.last_orders_update
      ? new Date(theComplex.last_orders_update)
      : null;
    const filters = lastCreatedAt ? { payed_at: { $gt: lastCreatedAt } } : {};
    return await this.model.find(filters).exec();
  }

  async uploadOrders(data?: { cashbank_id: string; token: string }) {
    const { cashbank_id, token } = data || {};
    const newOrders = await this.newOrders();
    const sendingData = cashbank_id
      ? {
          complex_id: process.env.COMPLEX_ID,
          orders: newOrders,
          cashbank_id,
        }
      : {
          complex_id: process.env.COMPLEX_ID,
          orders: newOrders,
        };

    try {
      await lastValueFrom(
        this.httpService.post(`${sofreBaseUrl}/orders/offline`, sendingData, {
          headers: { "api-key": process.env.SECRET, token },
        })
      );
      await this.complexService.updatedOrders();
    } catch (err) {
      console.log(err);
      return err.response.data;
    }
    return "success";
  }

  @Cron(CronExpression.EVERY_2_HOURS, {
    name: "complex-activation-cron",
    timeZone: "Asia/Tehran",
  })
  async handleCron() {
    await this.uploadOrders();
  }
}
