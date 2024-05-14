import { ComplexDocument } from "./complex.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom } from "rxjs";
import { sofreBaseUrl } from "src/helpers/constants";
import { Cron, CronExpression } from "@nestjs/schedule";

@Injectable()
export class ComplexService {
  constructor(
    @InjectModel("complex")
    private readonly model: Model<ComplexDocument>,
    private readonly httpService: HttpService
  ) {}

  async updateData() {
    const res = await lastValueFrom(
      this.httpService.get(
        `${sofreBaseUrl}/complex/localdb/${process.env.COMPLEX_ID}`,
        {
          headers: {
            apiKey: process.env.COMPLEX_TOKEN,
          },
        }
      )
    );
    await this.model.updateOne(
      { _id: process.env.COMPLEX_ID },
      { $set: res.data },
      { upsert: true }
    );
  }

  async findTheComplex() {
    return this.model.findOne({}).exec();
  }

  async isOwner(user_id: string | Types.ObjectId, complex_id: string) {
    return await this.model.exists({ _id: complex_id, owner: user_id });
  }

  @Cron(CronExpression.EVERY_6_HOURS, {
    name: "complex-update-cron",
    timeZone: "Asia/Tehran",
  })
  async handleCron() {
    await this.updateData();
  }
}
