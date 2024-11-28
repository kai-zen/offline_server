import { Model, PipelineStage, Types } from "mongoose";
import { AccessDocument } from "./access.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Injectable, NotFoundException } from "@nestjs/common";
import { messages, sofreBaseUrl } from "src/helpers/constants";
import { escapeRegex, toObjectId } from "src/helpers/functions";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom } from "rxjs";

@Injectable()
export class AccessService {
  constructor(
    @InjectModel("access")
    private readonly model: Model<AccessDocument>,
    private readonly httpService: HttpService
  ) {}

  async findAll(queryParams: { [props: string]: string }) {
    const { sort, direction = "asc", search = "", type } = queryParams || {};

    const cleanedSearch = search ? escapeRegex(search) : "";

    const filters: any[] = cleanedSearch
      ? [
          { type: type ? parseInt(type) : { $lte: 10 } },
          { "user.mobile": { $regex: cleanedSearch } },
          { "user.name": { $regex: cleanedSearch } },
        ]
      : [{ type: type ? parseInt(type) : { $lte: 10 } }];

    const aggregateQuery: PipelineStage[] = [
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $match: {
          $and: filters,
        },
      },
    ];

    const sortObj: { [properties: string]: 1 | -1 } = {};
    if (sort) {
      sortObj[sort] = direction === "asc" ? -1 : 1;
      aggregateQuery.push({ $sort: sortObj });
    }

    const [queryResult] =
      (await this.model.aggregate(aggregateQuery).exec()) || [];
    if (!queryResult) throw new NotFoundException(messages[404]);
    const { results } = queryResult;

    return { items: results, numberOfPages: 1 };
  }

  async updateData() {
    const res = await lastValueFrom(
      this.httpService.get(
        `${sofreBaseUrl}/access/localdb/${process.env.COMPLEX_ID}`,
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
        user: toObjectId(record.user),
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

  async hasAccess(user_id: string | Types.ObjectId, types: number[] | "all") {
    const count = await this.model.countDocuments();
    if (count === 0) return true;
    const filters =
      types === "all"
        ? { user: user_id }
        : {
            user: user_id,
            type: { $in: types },
          };
    return await this.model.findOne(filters);
  }

  async findByComplexAndUser(data: { user: string }) {
    const { user } = data;
    return await this.model.findOne({ user });
  }

  async findByComplexAndUserId(data: { user_id: Types.ObjectId }) {
    const { user_id } = data;
    const theAccess = await this.model.findOne({
      user: user_id,
    });
    return theAccess;
  }

  async findDeliveryGuy(data: { access_id: string; complex_id: string }) {
    const { access_id, complex_id } = data;
    const theAccess = await this.model.findOne({
      $and: [
        { complex: toObjectId(complex_id) },
        { _id: toObjectId(access_id) },
        { type: 9 },
      ],
    });
    return theAccess;
  }

  async findDeliveryGuys(complex: Types.ObjectId) {
    return await this.model.find({ complex, type: 9 });
  }
}
