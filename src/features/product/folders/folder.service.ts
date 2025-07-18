import { InjectModel } from "@nestjs/mongoose";
import { sofreBaseUrl } from "src/helpers/constants";
import { Model } from "mongoose";
import { ProductFolderDocument } from "./folder.schema";
import { toObjectId } from "src/helpers/functions";
import { BadRequestException, Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom } from "rxjs";

@Injectable()
export class ProductFolderService {
  constructor(
    @InjectModel("product-folder")
    private readonly model: Model<ProductFolderDocument>,
    private readonly httpService: HttpService
  ) {}

  async findAll() {
    return await this.model.find().exec();
  }

  async updateData() {
    try {
      const res = await lastValueFrom(
        this.httpService.get(
          `${sofreBaseUrl}/product-folder/localdb/${process.env.COMPLEX_ID}`,
          {
            headers: {
              "api-key": process.env.SECRET,
            },
          }
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
      console.log("Update folders error:", err);
      return "failed";
      throw new BadRequestException(
        "ذخیره آفلاین دسته‌ها با خطا مواجه شد. اتصال اینترنت خود را بررسی کنید."
      );
    }
  }
}
