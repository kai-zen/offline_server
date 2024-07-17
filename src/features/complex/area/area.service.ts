import { toObjectId } from "../../../helpers/functions";
import { InjectModel } from "@nestjs/mongoose";
import { sofreBaseUrl } from "src/helpers/constants";
import { Model } from "mongoose";
import { BadRequestException, Injectable } from "@nestjs/common";
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

  async findRelatedArea(data: { complex_id: string; table_number: number }) {
    const { complex_id, table_number } = data;
    const theArea = await this.model
      .findOne({
        complex: complex_id,
        tables: { $elemMatch: { $eq: Number(table_number) } },
      })
      .exec();
    if (!theArea) throw new BadRequestException("میز وارد شده معتبر نیست.");
    return theArea || null;
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
