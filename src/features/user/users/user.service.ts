import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { UserDocument } from "./user.schema";
import { lastValueFrom } from "rxjs";
import { messages, sofreBaseUrl } from "src/helpers/constants";
import { HttpService } from "@nestjs/axios";
import { escapeRegex, isValidDate, toObjectId } from "src/helpers/functions";
import { ComplexService } from "src/features/complex/complex/comlex.service";
import * as bcrypt from "bcrypt";

@Injectable()
export class UserService {
  constructor(
    @InjectModel("user") private readonly model: Model<UserDocument>,
    private readonly httpService: HttpService,
    private readonly complexService: ComplexService,
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
      {
        $facet: {
          results: [
            { $sort: sortObj },
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

  async createUser(mobile: string, needs_upload: boolean) {
    const theRecord = await this.model.findOne({ mobile });
    if (theRecord) return theRecord;
    const newRecord = new this.model({
      mobile,
      needs_upload: Boolean(needs_upload),
    });
    return await newRecord.save();
  }

  async uploadNeededs() {
    const records = await this.model.find({ needs_upload: true }).lean().exec();
    if (records && records.length > 0) {
      const complex = await this.complexService.findTheComplex();
      if (!complex) return "Not configed yet.";
      try {
        const formattedRecords = records.map((rec) => {
          const userId = rec.complex_user_id.toString
            ? rec.complex_user_id.toString()
            : rec.complex_user_id;
          return {
            mobile: rec.mobile,
            gender: rec.gender,
            name: rec.name,
            birthday: rec.birthday,
            complex_user_id: userId || null,
          };
        });
        await lastValueFrom(
          this.httpService.put(
            `${sofreBaseUrl}/complex-users/upload_offline/${complex._id.toString()}`,
            {
              complex_id: complex._id.toString(),
              users: formattedRecords,
            },
            { headers: { "api-key": complex.api_key } },
          ),
        );
        await this.model.updateMany({}, { $set: { needs_upload: false } });
      } catch (err) {
        console.log("Update user api error:", err.response.data);
        return err.response.data;
      }
      return "success";
    }
  }

  async setName(data: {
    user_id: string | Types.ObjectId;
    name: string;
    gender: 0 | 1 | 2;
    birthday: string | null;
    needs_upload: boolean;
    mobile?: string;
  }) {
    const { name, user_id, gender, birthday, needs_upload, mobile } = data;
    let theRecord = user_id
      ? await this.model.findOne({
          _id: toObjectId(user_id),
        })
      : null;
    if (mobile && !theRecord) theRecord = await this.model.findOne({ mobile });

    if (!theRecord) throw new NotFoundException(messages[404]);
    if (theRecord) {
      theRecord.name = name || "";
      if (gender && [0, 1, 2].includes(gender)) theRecord.gender = gender;
      if (typeof birthday === "string" && isValidDate(birthday))
        theRecord.birthday = new Date(birthday);
      theRecord.needs_upload = Boolean(needs_upload);
      return await theRecord.save();
    }
  }

  userDataFormatter(record: any) {
    if (!record?._id || !record?.user?._id || !record?.user?.mobile)
      return null;
    const name = record.name || record.user?.name || "";
    const objecIdId = toObjectId(record.user._id);
    const complexUserId = toObjectId(record._id);

    const modifiedResponse = {
      _id: objecIdId,
      image: record.image,
      mobile: record.user.mobile,
      complex_user_id: complexUserId,
      name,
      orders: record.orders?.length ? record.orders : [],
      products: record.products?.length ? record.products : [],
      birthday: record.birthday || record.user?.birthday || null,
      gender: record.gender || 0,
      subscription_number: record?.subscription_number || null,
      last_visit: record.last_visit ? new Date(record.last_visit) : null,
    };
    return modifiedResponse;
  }

  async validatePassword(user_id: Types.ObjectId, password: string) {
    const theUser = await this.model.findById(toObjectId(user_id));

    if (!theUser) throw new NotFoundException(messages[404]);
    else if (typeof theUser.password !== "string")
      throw new BadRequestException(messages[400]);

    return await bcrypt.compare(password, theUser.password);
  }

  async updateData() {
    const complex = await this.complexService.findTheComplex();
    if (!complex) return "Not configed yet.";

    const timeNumber = complex?.last_users_update
      ? new Date(complex.last_users_update).getTime()
      : null;

    const apiRouteMaker = (pageNumber: string | number) => {
      const staticPart = `${sofreBaseUrl}/complex-users/localdb/${complex._id.toString()}/${pageNumber}`;
      return timeNumber
        ? `${staticPart}?last_update=${timeNumber}`
        : staticPart;
    };

    let hasMore = true;
    let hasError = false;
    let page = 1;
    while (hasMore) {
      try {
        const res = await lastValueFrom(
          this.httpService.get(apiRouteMaker(page), {
            headers: { "api-key": complex.api_key },
          }),
        );
        if (res.data && res.data.length > 0) {
          for await (const record of res.data) {
            try {
              const modifiedResponse = this.userDataFormatter(record);
              if (modifiedResponse) {
                await this.model.updateOne(
                  { mobile: modifiedResponse.mobile },
                  { $set: modifiedResponse },
                  { upsert: true },
                );
              }
            } catch (err) {
              console.log("Update user error:", { cause: err });
            }
          }
          ++page;
        } else hasMore = false;
      } catch (err) {
        hasMore = false;
        hasError = true;
      }
    }

    if (!hasError) {
      await this.complexService.updatedUsers();
      return "success";
    } else {
      throw new BadRequestException(
        `خطایی در به‌روزرسانی صفحه ${page} از مشتریان رخ داد.`,
      );
    }
  }
}
