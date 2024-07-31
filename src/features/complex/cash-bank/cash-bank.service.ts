import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CashBank } from "./cash-bank.schema";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom } from "rxjs";
import { sofreBaseUrl } from "src/helpers/constants";
import { toObjectId } from "src/helpers/functions";

@Injectable()
export class CashBankService {
  constructor(
    @InjectModel("cash-bank")
    private readonly model: Model<CashBank>,

    private readonly httpService: HttpService
  ) {}

  async findAll() {
    return await this.model.find().exec();
  }

  async findByComplex() {
    return await this.model.find().select("-complex").exec();
  }

  async findById(id: string) {
    return await this.model.findById(id);
  }

  async updateData() {
    try {
      const res = await lastValueFrom(
        this.httpService.get(
          `${sofreBaseUrl}/cash-bank/localdb/${process.env.COMPLEX_ID}`,
          { headers: { "api-key": process.env.SECRET } }
        )
      );
      for await (const record of res.data || []) {
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
    } catch (err) {
      console.log(err, "cash-bank/localdb");
    }
    return "success";
  }
}
