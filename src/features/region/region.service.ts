import { InjectModel } from "@nestjs/mongoose";
import { messages, sofreBaseUrl } from "src/helpers/constants";
import { Model } from "mongoose";
import { toObjectId } from "src/helpers/functions";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom } from "rxjs";
import { RegionDocument } from "./region.schema";
import { ComplexService } from "src/features/complex/complex/comlex.service";

@Injectable()
export class RegionService {
  constructor(
    @InjectModel("region")
    private readonly model: Model<RegionDocument>,
    private readonly httpService: HttpService,
    private readonly complexService: ComplexService
  ) {}

  async findAll() {
    return await this.model.find({}).exec();
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
      const complex = await this.complexService.findTheComplex();
      if (!complex) throw new NotFoundException(messages[404]);
      const currentCount = await this.model.countDocuments();
      if (currentCount > 1) return;
      const res = await lastValueFrom(
        this.httpService.get(
          `${sofreBaseUrl}/region/${complex._id.toString()}`,
          {
            headers: { "api-key": complex.api_key },
          }
        )
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
