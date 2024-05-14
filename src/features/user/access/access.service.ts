import { Model, Types } from "mongoose";
import { AccessDocument } from "./access.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Injectable } from "@nestjs/common";
import { sofreBaseUrl } from "src/helpers/constants";
import { toObjectId } from "src/helpers/functions";
import { HttpService } from "@nestjs/axios";
import { Cron, CronExpression } from "@nestjs/schedule";
import { lastValueFrom } from "rxjs";

@Injectable()
export class AccessService {
  constructor(
    @InjectModel("access")
    private readonly model: Model<AccessDocument>,
    private readonly httpService: HttpService
  ) {}

  async updateData() {
    const res = await lastValueFrom(
      this.httpService.get(
        `${sofreBaseUrl}/access/localdb/${process.env.COMPLEX_ID}`,
        {
          headers: {
            apiKey: process.env.COMPLEX_TOKEN,
          },
        }
      )
    );
    console.log(res);
    return res;
    for await (const record of res.data) {
      const modifiedResponse = res.data.map((item) => ({
        ...item,
        _id: toObjectId(item._id),
        user: toObjectId(item.user),
        complex: toObjectId(item.complex),
      }));
      await this.model.updateMany(
        { _id: record._id },
        { $set: modifiedResponse },
        { upsert: true }
      );
    }
  }

  async hasAccess(
    user_id: string | Types.ObjectId,
    complex_id: string,
    types: number[]
  ) {
    return await this.model.findOne({
      user: user_id,
      complex: complex_id,
      type: { $in: types },
    });
  }

  async findByComplexAndUser(data: { user: string }) {
    const { user } = data;
    return await this.model.findOne({ user });
  }

  async findDeliveryGuy(data: { access_id: string; complex_id: string }) {
    const { access_id, complex_id } = data;
    const theAccess = await this.model.findOne({
      $and: [
        { complex: toObjectId(complex_id) },
        { _id: toObjectId(access_id) },
        { type: 9 },
      ],
    });
    return theAccess;
  }

  @Cron(CronExpression.EVERY_3_HOURS, {
    name: "ranges-update-cron",
    timeZone: "Asia/Tehran",
  })
  async handleCron() {
    await this.updateData();
  }
}
