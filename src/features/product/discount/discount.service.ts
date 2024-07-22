import { DiscountDocument } from "./discount.schema";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { toObjectId } from "src/helpers/functions";
import { sofreBaseUrl } from "src/helpers/constants";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom } from "rxjs";

@Injectable()
export class DiscountService {
  constructor(
    @InjectModel("discount")
    private readonly model: Model<DiscountDocument>,
    private readonly httpService: HttpService
  ) {}

  async findAll() {
    return await this.model
      .find()
      .populate("products")
      .populate("folders")
      .exec();
  }

  async updateData() {
    const res = await lastValueFrom(
      this.httpService.get(
        `${sofreBaseUrl}/discount/localdb/${process.env.COMPLEX_ID}`,
        {
          headers: {
            "api-key": process.env.SECRET,
          },
        }
      )
    );

    for await (const record of res.data) {
      const productsObjectIds = (record.products || []).map((p) =>
        toObjectId(p?._id || p)
      );
      const foldersObjectIds = (record.folders || []).map((f) =>
        toObjectId(f?._id || f)
      );
      const modifiedResponse = {
        ...record,
        products: productsObjectIds || [],
        folders: foldersObjectIds || [],
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
