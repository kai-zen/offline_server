import { ComplexDocument } from "./complex.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom } from "rxjs";
import { messages, sofreBaseUrl } from "src/helpers/constants";

@Injectable()
export class ComplexService {
  constructor(
    @InjectModel("complex")
    private readonly model: Model<ComplexDocument>,
    private readonly httpService: HttpService
  ) {}

  async updateData() {
    try {
      const res = await lastValueFrom(
        this.httpService.get(
          `${sofreBaseUrl}/complex/localdb/${process.env.COMPLEX_ID}`,
          {
            headers: {
              "api-key": process.env.SECRET,
            },
          }
        )
      );
      await this.model.updateOne(
        { _id: process.env.COMPLEX_ID },
        { $set: res.data },
        { upsert: true }
      );
      return "success";
    } catch (err) {
      console.log("Update complex error:", err);
      return "failed";
      throw new BadRequestException(
        "ذخیره آفلاین مشخصات مجموعه با خطا مواجه شد. اتصال اینترنت خود را بررسی کنید."
      );
    }
  }

  async updatedAddress() {
    const theRecord = await this.model.findOne({}).exec();
    if (!theRecord) throw new NotFoundException(messages[404]);
    theRecord.last_addresses_update = new Date();
    return await theRecord.save();
  }

  async updatedUsers() {
    const theRecord = await this.model.findOne({}).exec();
    if (!theRecord) throw new NotFoundException(messages[404]);
    theRecord.last_users_update = new Date();
    return await theRecord.save();
  }

  async findTheComplex() {
    return await this.model.findOne({}).exec();
  }

  async isOwner(user_id: string | Types.ObjectId, complex_id: string) {
    return await this.model.exists({ _id: complex_id, owner: user_id });
  }
}
