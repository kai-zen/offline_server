import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { UserDocument } from "./user.schema";
import { lastValueFrom } from "rxjs";
import { sofreBaseUrl } from "src/helpers/constants";
import { HttpService } from "@nestjs/axios";
import { escapeRegex, toObjectId } from "src/helpers/functions";
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

    const cleanedSearch = search ? escapeRegex(search) : "";
    const filters = cleanedSearch
      ? {
          $or: [
            { name: { $regex: cleanedSearch } },
            { username: { $regex: cleanedSearch } },
            { mobile: { $regex: cleanedSearch } },
          ],
        }
      : {};
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

  async setName(data: { id: string; name: string }) {
    const { name, id } = data;
    const theRecord = await this.model.findById(id);
    if (theRecord) {
      theRecord.name = name;
      return await theRecord.save();
    }
  }

  async updateData() {
    const theComplex = await this.complexService.findTheComplex();
    if (!theComplex) return;
    const timeNumber = theComplex.last_users_update
      ? new Date(theComplex.last_users_update).getTime()
      : null;

    if (timeNumber) {
      const res = await lastValueFrom(
        this.httpService.get(
          `${sofreBaseUrl}/user/localdb/${process.env.COMPLEX_ID}?last_update=${timeNumber}`,
          { headers: { "api-key": process.env.SECRET } }
        )
      );
      if (res.data && res.data.length > 0) {
        for await (const record of res.data) {
          const name = record.complexUser?.name || record.name || "";
          const objecIdId = toObjectId(record._id);
          const modifiedResponse = {
            ...record,
            name,
            orders: record.complexUser?.orders?.length
              ? record.complexUser.orders
              : [],
            products: record.complexUser?.products?.length
              ? record.complexUser.products
              : [],
            _id: objecIdId,
          };
          await this.model.updateOne(
            { _id: objecIdId },
            { $set: modifiedResponse },
            { upsert: true }
          );
        }
        await this.complexService.updatedUsers();
        return "success";
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
          { headers: { "api-key": process.env.SECRET } }
        )
      );
      if (res?.data?.length > 0) {
        for await (const record of res.data) {
          const name = record.complexUser?.name || record.name || "";
          const objecIdId = toObjectId(record._id);
          const modifiedResponse = {
            ...record,
            name,
            _id: objecIdId,
          };
          await this.model.updateOne(
            { _id: objecIdId },
            { $set: modifiedResponse },
            { upsert: true }
          );
        }
        ++page;
      } else hasMore = false;
    }
    await this.complexService.updatedUsers();
    return "success";
  }
}
