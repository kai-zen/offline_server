import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CashBank } from "./cash-bank.schema";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom } from "rxjs";
import { sofreBaseUrl } from "src/helpers/constants";
import { toObjectId } from "src/helpers/functions";
import { Cron, CronExpression } from "@nestjs/schedule";

@Injectable()
export class CashBankService {
  constructor(
    @InjectModel("cash-bank")
    private readonly model: Model<CashBank>,
    private readonly httpService: HttpService
  ) {}

  async findAll() {
    return await this.model.find().exec();
  }

  async updateData() {
    const res = await lastValueFrom(
      this.httpService.get(
        `${sofreBaseUrl}/cash-bank/localdb/${process.env.COMPLEX_ID}`
      )
    );
    for await (const cashbank of res.data) {
      const modifiedResponse = res.data.map((item) => ({
        ...item,
        _id: toObjectId(item._id),
        complex: toObjectId(item.complex),
      }));
      await this.model.updateMany(
        { _id: cashbank._id },
        { $set: modifiedResponse },
        { upsert: true }
      );
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_10AM, {
    name: "complex-update-cron",
    timeZone: "Asia/Tehran",
  })
  async handleCron() {
    await this.updateData();
  }
}
