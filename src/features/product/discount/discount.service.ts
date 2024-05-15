import { Cron, CronExpression } from "@nestjs/schedule";
import { DiscountDocument } from "./discount.schema";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { toObjectId } from "src/helpers/functions";
import { sofreBaseUrl } from "src/helpers/constants";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom } from "rxjs";

@Injectable()
export class DiscountService {
  constructor(
    @InjectModel("discount")
    private readonly model: Model<DiscountDocument>,
    private readonly httpService: HttpService
  ) {}

  async findAll() {
    return await this.model
      .find()
      .populate("products")
      .populate("folders")
      .exec();
  }

  async updateData() {
    const res = await lastValueFrom(
      this.httpService.get(
        `${sofreBaseUrl}/discount/localdb/${process.env.COMPLEX_ID}`,
        {
          headers: {
            "api-key": process.env.COMPLEX_TOKEN,
          },
        }
      )
    );
    for await (const record of res.data) {
      const productsObjectIds = (record.products || []).map((p) =>
        toObjectId(p)
      );
      const foldersObjectIds = (record.folders || []).map((f) => toObjectId(f));
      const modifiedResponse = {
        ...record,
        products: productsObjectIds || [],
        folders: foldersObjectIds || [],
        _id: toObjectId(record._id),
        complex: toObjectId(record.complex),
      };
      await this.model.updateMany(
        { _id: modifiedResponse._id },
        { $set: modifiedResponse },
        { upsert: true }
      );
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_11AM, {
    name: "discounts-update-cron",
    timeZone: "Asia/Tehran",
  })
  async handleCron() {
    await this.updateData();
  }
}
