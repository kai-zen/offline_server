import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { UserDocument } from "./user.schema";
import { lastValueFrom } from "rxjs";
import { messages, sofreBaseUrl } from "src/helpers/constants";
import { HttpService } from "@nestjs/axios";
import { escapeRegex, isValidDate, toObjectId } from "src/helpers/functions";
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
      limit,
      page = "1",
      sort,
      direction = "asc",
    } = queryParams || {};

    const applyingLimit = parseInt(limit) || 16;
    const sortObj = {};
    sortObj[sort || "orders_count"] = direction === "asc" ? -1 : 1;

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
    const [queryResult] = await this.model.aggregate([
      { $match: filters },
      { $addFields: { orders_count: { $size: "$orders" } } },
      { $sort: sortObj },
      {
        $facet: {
          results: [
            { $skip: (parseInt(page) - 1) * applyingLimit },
            { $limit: applyingLimit },
          ],
          totalDocuments: [{ $count: "count" }],
        },
      },
    ]);
    if (!queryResult) throw new NotFoundException(messages[404]);
    const { results, totalDocuments } = queryResult;
    const numberOfPages = Math.ceil(totalDocuments?.[0]?.count / applyingLimit);

    return { items: results, numberOfPages };
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

  async setName(data: {
    id: string;
    name: string;
    gender: 0 | 1 | 2;
    birthday: string | null;
  }) {
    const { name, id, gender, birthday } = data;
    const theRecord = await this.model.findById(id);
    if (theRecord) {
      theRecord.name = name;
      if (gender && [0, 1, 2].includes(gender)) theRecord.gender = gender;
      if (typeof birthday === "string" && isValidDate(birthday))
        theRecord.birthday = new Date(birthday);
      return await theRecord.save();
    }
  }

  userDataFormatter(record: any) {
    const name = record.complexUser?.name || record.name || "";
    const objecIdId = toObjectId(record._id);
    const modifiedResponse = {
      _id: objecIdId,
      mobile: record.mobile,
      complex_user_id: record.complexUser?._id
        ? toObjectId(record.complexUser._id)
        : null,
      name,
      orders: record.complexUser?.orders?.length
        ? record.complexUser.orders
        : [],
      products: record.complexUser?.products?.length
        ? record.complexUser.products
        : [],
      birthday: record.birthday || record.complexUser.birthday || null,
      gender: record.gender || record.complexUser.gender || 0,
      subscription_number: record.complexUser?.subscription_number || null,
      last_visit: record.complexUser?.last_visit
        ? new Date(record.complexUser.last_visit)
        : null,
    };
    return modifiedResponse;
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
          const modifiedResponse = this.userDataFormatter(record);
          await this.model.updateOne(
            { _id: modifiedResponse._id },
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
          const modifiedResponse = this.userDataFormatter(record);
          await this.model.updateOne(
            { _id: modifiedResponse._id },
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
