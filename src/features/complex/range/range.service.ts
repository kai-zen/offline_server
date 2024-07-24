import { toObjectId } from "src/helpers/functions";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { sofreBaseUrl } from "src/helpers/constants";
import { Model } from "mongoose";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom } from "rxjs";
import { Range } from "./range.schema";
import { RegionService } from "src/features/region/region.service";

@Injectable()
export class RangeService {
  constructor(
    @InjectModel("range")
    private readonly model: Model<Range>,
    private readonly regionService: RegionService,
    private readonly httpService: HttpService
  ) {}

  async findAll() {
    return await this.model.find().exec();
  }

  async findCorrespondingRange(data: { latitude: number; longitude: number }) {
    const { latitude, longitude } = data;

    await this.regionService.updateDB();

    const theRegion = await this.regionService.findRegionByCoordinates({
      lat: latitude,
      lng: longitude,
    });
    if (!theRegion) return null;
    return await this.model
      .findOne({
        regions: { $elemMatch: { $eq: theRegion._id } },
        is_active: true,
      })
      .exec();
  }

  async updateData() {
    const res = await lastValueFrom(
      this.httpService.get(
        `${sofreBaseUrl}/range/localdb/${process.env.COMPLEX_ID}`,
        { headers: { "api-key": process.env.SECRET } }
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
  }
}
