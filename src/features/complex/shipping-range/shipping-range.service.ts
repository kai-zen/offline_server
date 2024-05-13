import { distanceCalculator, toObjectId } from "src/helpers/functions";
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { messages, sofreBaseUrl } from "src/helpers/constants";
import { Model } from "mongoose";
import { ShippingRange } from "./shipping-range.schema";
import { Cron, CronExpression } from "@nestjs/schedule";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom } from "rxjs";
import { ComplexService } from "../complex/comlex.service";

@Injectable()
export class ShippingRangeService {
  constructor(
    @InjectModel("shipping-range")
    private readonly model: Model<ShippingRange>,
    private readonly complexService: ComplexService,
    private readonly httpService: HttpService
  ) {}

  async findAll() {
    return await this.model.find().exec();
  }

  async findCorrespondingRange(coords: [number, number], complex_id: string) {
    const theComplex = await this.complexService.findTheComplex();
    if (!theComplex) throw new NotFoundException("مجموعه پیدا نشد.");

    const [latitude, longitude] = coords;
    const [complexLongitude, complexLatitude] =
      theComplex.address?.location?.coordinates || [];

    if (!complexLatitude || !complexLongitude)
      throw new NotFoundException(messages[404]);

    const theDistance = distanceCalculator(
      [complexLatitude, complexLongitude],
      [latitude, longitude]
    );
    const ranges = await this.model
      .find({
        $and: [
          { radius: { $gt: theDistance } },
          { complex: toObjectId(complex_id) },
        ],
      })
      .sort({ radius: 1 });
    return ranges?.[0] || null;
  }

  async updateData() {
    const res = await lastValueFrom(
      this.httpService.get(
        `${sofreBaseUrl}/shipping-range/localdb/${process.env.COMPLEX_ID}`
      )
    );
    for await (const record of res.data) {
      const modifiedResponse = res.data.map((item) => ({
        ...item,
        _id: toObjectId(item._id),
        complex: toObjectId(item.complex),
      }));
      await this.model.updateMany(
        { _id: record._id },
        { $set: modifiedResponse },
        { upsert: true }
      );
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_4AM, {
    name: "ranges-update-cron",
    timeZone: "Asia/Tehran",
  })
  async handleCron() {
    await this.updateData();
  }
}
