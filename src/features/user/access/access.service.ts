import { Model, PipelineStage, Types } from "mongoose";
import { AccessDocument } from "./access.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Injectable, NotFoundException } from "@nestjs/common";
import { messages, sofreBaseUrl } from "src/helpers/constants";
import { toObjectId } from "src/helpers/functions";
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
    const {
      limit = "8",
      page = "1",
      sort,
      direction = "asc",
      search = "",
      type,
    } = queryParams || {};

    const searchRegex = new RegExp(`^${search}`, "i");
    const applyingLimit = parseInt(limit) || 12;

    const filters = {
      $and: [
        { type: type ? parseInt(type) : { $lte: 10 } },
        {
          $or: [{ "user.mobile": searchRegex }, { "user.name": searchRegex }],
        },
      ],
    };
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
      { $match: filters },
      {
        $facet: {
          results: [
            { $skip: (parseInt(page) - 1) * applyingLimit },
            { $limit: applyingLimit },
          ],
          totalDocuments: [{ $count: "count" }],
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
    const { results, totalDocuments } = queryResult;
    const numberOfPages = Math.ceil(
      (totalDocuments?.[0]?.count || 1) / applyingLimit
    );

    return { items: results, numberOfPages };
  }

  async updateData() {
    const res = await lastValueFrom(
      this.httpService.get(
        `${sofreBaseUrl}/access/localdb/${process.env.COMPLEX_ID}`,
        {
          headers: {
            "api-key": process.env.COMPLEX_TOKEN,
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
  }

  async hasAccess(
    user_id: string | Types.ObjectId,
    complex_id: string,
    types: number[]
  ) {
    return await this.model.findOne({
      user: user_id,
      complex: complex_id,
      type: { $in: types },
    });
  }

  async findByComplexAndUser(data: { user: string }) {
    const { user } = data;
    return await this.model.findOne({ user });
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
}
