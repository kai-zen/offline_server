import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { UserDocument } from "./user.schema";
import { lastValueFrom } from "rxjs";
import { requestHeader, sofreBaseUrl } from "src/helpers/constants";
import { HttpService } from "@nestjs/axios";
import { toObjectId } from "src/helpers/functions";
import { ComplexService } from "src/features/complex/complex/comlex.service";

@Injectable()
export class UserService {
  constructor(
    @InjectModel("user") private readonly model: Model<UserDocument>,
    private readonly httpService: HttpService,
    private readonly complexService: ComplexService
  ) {}

  async findAll(queryParams: { [props: string]: string }) {
    const {
      search = "",
      limit = "12",
      page = "1",
      sort,
      direction = "asc",
    } = queryParams || {};

    const sortObj = {};
    if (sort) sortObj[sort] = direction === "asc" ? -1 : 1;
    const searchRegex = new RegExp(`^${search}`, "i");

    const filters = {
      $or: [
        { name: searchRegex },
        { username: searchRegex },
        { mobile: searchRegex },
      ],
    };
    const results = await this.model
      .find(filters)
      .sort(sortObj)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .exec();

    const totalDocuments = await this.model
      .find(filters)
      .countDocuments()
      .exec();
    const numberOfPages = Math.ceil(totalDocuments / parseInt(limit));

    return {
      items: results,
      numberOfPages,
    };
  }

  async findById(id: string | Types.ObjectId) {
    return await this.model.findById(id);
  }

  async findByMobile(mobile: string) {
    return await this.model.findOne({ mobile });
  }

  async createUser(mobile: string) {
    const newRecord = new this.model({ mobile });
    return await newRecord.save();
  }

  async updateData() {
    const theComplex = await this.complexService.findTheComplex();
    const timeNumber = new Date(theComplex.last_users_update).getTime();
    if (timeNumber) {
      const res = await lastValueFrom(
        this.httpService.get(
          `${sofreBaseUrl}/user/localdb/${process.env.COMPLEX_ID}?last_update=${timeNumber}`,
          requestHeader
        )
      );
      if (res.data && res.data.length > 0)
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
    } else await this.updateForFirstTime();
  }

  async updateForFirstTime() {
    let hasMore = true;
    let page = 1;
    while (hasMore) {
      const res = await lastValueFrom(
        this.httpService.get(
          `${sofreBaseUrl}/user/localdb/${process.env.COMPLEX_ID}/${page}`,
          requestHeader
        )
      );
      if (res?.data?.length > 0) {
        for await (const record of res.data) {
          await this.model.updateOne(
            { _id: toObjectId(record._id) },
            { $set: record },
            { upsert: true }
          );
        }
        ++page;
      } else hasMore = false;
    }
  }
}
