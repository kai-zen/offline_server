import { InjectModel } from "@nestjs/mongoose";
import { sofreBaseUrl } from "src/helpers/constants";
import { Model } from "mongoose";
import { toObjectId } from "src/helpers/functions";
import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom } from "rxjs";
import { PrinterDocument } from "./printer.schema";

@Injectable()
export class PrinterService {
  constructor(
    @InjectModel("printer")
    private readonly model: Model<PrinterDocument>,
    private readonly httpService: HttpService
  ) {}

  async findAll() {
    return await this.model.find().exec();
  }

  async updateData() {
    const res = await lastValueFrom(
      this.httpService.get(
        `${sofreBaseUrl}/printer/localdb/${process.env.COMPLEX_ID}`,
        {
          headers: {
            "api-key": process.env.SECRET,
          },
        }
      )
    );
    await this.model.deleteMany({});
    const modifiedResults = (res.data || []).map((record) => {
      const areas =
        (record.areas || []).map((a) => toObjectId(a?._id || a)) || [];
      const folders =
        (record.folders || []).map((f) => toObjectId(f?._id || f)) || [];

      return {
        ...record,
        folders,
        areas,
        _id: toObjectId(record._id),
        complex: toObjectId(record.complex),
      };
    });
    await this.model.insertMany(modifiedResults);
  }
}
