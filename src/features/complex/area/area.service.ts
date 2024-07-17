import { InjectModel } from "@nestjs/mongoose";
import { sofreBaseUrl } from "src/helpers/constants";
import { Model } from "mongoose";
import { toObjectId } from "src/helpers/functions";
import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom } from "rxjs";
import { AreaDocument } from "./area.schema";

@Injectable()
export class AreaService {
  constructor(
    @InjectModel("area")
    private readonly model: Model<AreaDocument>,
    private readonly httpService: HttpService
  ) {}

  async findAll() {
    return await this.model.find().exec();
  }

  async updateData() {
    const res = await lastValueFrom(
      this.httpService.get(
        `${sofreBaseUrl}/area/localdb/${process.env.COMPLEX_ID}`,
        {
          headers: {
            "api-key": process.env.COMPLEX_TOKEN,
          },
        }
      )
    );
    await this.model.deleteMany({});
    const modifiedResults = (res.data || []).map((record) => ({
      ...record,
      _id: toObjectId(record._id),
      complex: toObjectId(record.complex),
    }));
    await this.model.insertMany(modifiedResults);
  }
}
