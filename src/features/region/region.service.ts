import { InjectModel } from "@nestjs/mongoose";
import { sofreBaseUrl } from "src/helpers/constants";
import { Model } from "mongoose";
import { toObjectId } from "src/helpers/functions";
import { BadRequestException, Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom } from "rxjs";
import { RegionDocument } from "./region.schema";

@Injectable()
export class RegionService {
  constructor(
    @InjectModel("region")
    private readonly model: Model<RegionDocument>,
    private readonly httpService: HttpService
  ) {}

  async findAll() {
    return await this.model.find().exec();
  }

  async findRegionByCoordinates(coords: { lat: number; lng: number }) {
    const { lat, lng } = coords;
    return await this.model
      .findOne({
        geometry: {
          $geoIntersects: {
            $geometry: {
              type: "Point",
              coordinates: [lng, lat],
            },
          },
        },
      })
      .exec();
  }

  async updateDB() {
    try {
      const currentCount = await this.model.countDocuments();
      if (currentCount > 1) return;
      const res = await lastValueFrom(
        this.httpService.get(`${sofreBaseUrl}/region/${process.env.CITY_ID}`, {
          headers: { "api-key": process.env.SECRET },
        })
      );
      for await (const record of res.data) {
        const modifiedResponse = {
          ...record,
          _id: toObjectId(record._id),
        };
        await this.model.updateOne(
          { _id: modifiedResponse._id },
          { $set: modifiedResponse },
          { upsert: true }
        );
      }
      return "success";
    } catch (err) {
      console.log("Update regions error:", err);
      return "failed";
      throw new BadRequestException(
        "ذخیره آفلاین مناطق شهر شما با خطا مواجه شد. اتصال اینترنت خود را بررسی کنید."
      );
    }
  }
}
