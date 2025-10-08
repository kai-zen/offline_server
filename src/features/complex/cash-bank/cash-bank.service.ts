import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CashBank } from "./cash-bank.schema";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom } from "rxjs";
import { messages, sofreBaseUrl } from "src/helpers/constants";
import { toObjectId } from "src/helpers/functions";
import { ComplexService } from "../complex/comlex.service";

@Injectable()
export class CashBankService {
  constructor(
    @InjectModel("cash-bank")
    private readonly model: Model<CashBank>,
    private readonly httpService: HttpService,
    private readonly complexService: ComplexService
  ) {}

  async findAll() {
    return await this.model.find({}).exec();
  }

  async findByComplex() {
    return await this.model.find({}).exec();
  }

  async findById(id: string) {
    return await this.model.findById(id);
  }

  async updateData() {
    const complex = await this.complexService.findTheComplex();
    if (!complex) return "Not configed yet.";
    try {
      const res = await lastValueFrom(
        this.httpService.get(
          `${sofreBaseUrl}/cash-bank/localdb/${complex._id.toString()}`,
          { headers: { "api-key": complex.api_key } }
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
      return "success";
    } catch (err) {
      throw new BadRequestException(
        "ذخیره آفلاین صندوق‌ها با خطا مواجه شد. اتصال اینترنت خود را بررسی کنید."
      );
    }
  }
}
