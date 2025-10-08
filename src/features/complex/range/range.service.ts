import { toObjectId } from "src/helpers/functions";
import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { sofreBaseUrl } from "src/helpers/constants";
import { Model } from "mongoose";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom } from "rxjs";
import { Range } from "./range.schema";
import { RegionService } from "src/features/region/region.service";
import { ComplexService } from "../complex/comlex.service";

@Injectable()
export class RangeService {
  constructor(
    @InjectModel("range")
    private readonly model: Model<Range>,
    private readonly regionService: RegionService,
    private readonly httpService: HttpService,
    private readonly complexService: ComplexService
  ) {}

  async findAll() {
    return await this.model.find({}).exec();
  }

  async findCorrespondingRange(data: { latitude: number; longitude: number }) {
    const { latitude, longitude } = data;

    const theRegion = await this.regionService.findRegionByCoordinates({
      lat: latitude,
      lng: longitude,
    });
    if (!theRegion) return null;
    return await this.model
      .findOne({
        regions: { $elemMatch: { $eq: toObjectId(theRegion._id) } },
        is_active: true,
      })
      .exec();
  }

  async updateData() {
    const complex = await this.complexService.findTheComplex();
    if (!complex) return "Not configed yet.";
    try {
      await this.regionService.updateDB();
      const res = await lastValueFrom(
        this.httpService.get(
          `${sofreBaseUrl}/range/localdb/${complex._id.toString()}`,
          { headers: { "api-key": complex.api_key } }
        )
      );
      for await (const record of res.data) {
        const modifiedResponse = {
          ...record,
          _id: toObjectId(record._id),
          complex: toObjectId(record.complex),
        };
        await this.model.updateOne(
          { _id: modifiedResponse._id },
          { $set: modifiedResponse },
          { upsert: true }
        );
      }
      return "success";
    } catch (err) {
      console.log("Update ranges error:", err);
      return "failed";
      throw new BadRequestException(
        "ذخیره آفلاین پرینترها با خطا مواجه شد. اتصال اینترنت خود را بررسی کنید."
      );
    }
  }
}
