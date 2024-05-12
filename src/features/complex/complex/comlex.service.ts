import { ComplexDocument } from "./complex.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom } from "rxjs";
import { sofreBaseUrl } from "src/helpers/constants";

@Injectable()
export class ComplexService {
  constructor(
    @InjectModel("complex")
    private readonly model: Model<ComplexDocument>,
    private readonly httpService: HttpService
  ) {}

  async updateData() {
    const res = await lastValueFrom(
      this.httpService.get(
        `${sofreBaseUrl}/complex/localdb/${process.env.COMPLEX_ID}`
      )
    );
    await this.model.updateOne(
      { _id: process.env.COMPLEX_ID },
      { $set: res.data },
      { upsert: true }
    );
  }

  async findTheComplex() {
    return this.model.findOne({}).exec();
  }

  async isOwner(user_id: string | Types.ObjectId, complex_id: string) {
    return await this.model.exists({ _id: complex_id, owner: user_id });
  }
}
