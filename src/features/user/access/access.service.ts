import { Model, PipelineStage, Types } from "mongoose";
import { AccessDocument } from "./access.schema";
import { InjectModel } from "@nestjs/mongoose";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { messages, sofreBaseUrl } from "src/helpers/constants";
import { escapeRegex, toObjectId } from "src/helpers/functions";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom } from "rxjs";
import { ComplexService } from "src/features/complex/complex/comlex.service";

@Injectable()
export class AccessService {
  constructor(
    @InjectModel("access")
    private readonly model: Model<AccessDocument>,
    private readonly httpService: HttpService,
    private readonly complexService: ComplexService
  ) {}

  async findAll(queryParams: { [props: string]: string }) {
    const { search = "", type } = queryParams || {};
    const cleanedSearch = search ? escapeRegex(search) : "";

    const filters: any[] = [];
    if (type) filters.push({ type: parseInt(type) });
    if (cleanedSearch)
      filters.push({
        $or: [
          { "user.mobile": { $regex: cleanedSearch } },
          { "user.name": { $regex: cleanedSearch } },
        ],
      });

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
    ];
    if (filters.length)
      aggregateQuery.push({
        $match: {
          $and: filters,
        },
      });

    const [queryResult] =
      (await this.model.aggregate(aggregateQuery).exec()) || [];
    if (!queryResult) throw new NotFoundException(messages[404]);
    const { results } = queryResult;

    return { items: results, numberOfPages: 1 };
  }

  async updateData() {
    try {
      const complex = await this.complexService.findTheComplex();
      if (!complex) throw new NotFoundException(messages[404]);
      const res = await lastValueFrom(
        this.httpService.get(
          `${sofreBaseUrl}/access/localdb/${complex._id.toString()}`,
          {
            headers: {
              "api-key": complex.api_key,
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
    } catch (err) {
      console.log("Update accesses error:", err);
      return "failed";
      throw new BadRequestException(
        "ذخیره آفلاین دسترسی‌های پرسنل با خطا مواجه شد. اتصال اینترنت خود را بررسی کنید."
      );
    }
  }

  async hasAccess(user_id: string | Types.ObjectId, types: number[] | "all") {
    const count = await this.model.countDocuments();
    if (count === 0) return true;

    const userObjId = toObjectId(user_id);
    const filters =
      types === "all"
        ? { user: userObjId, is_active: true }
        : {
            user: userObjId,
            type: { $in: types },
            is_active: true,
          };
    return await this.model.findOne(filters);
  }

  async findDeliveryGuy(data: { access_id: string; complex_id: string }) {
    const { access_id, complex_id } = data;
    const theAccess = await this.model.findOne({
      $and: [
        { complex: toObjectId(complex_id) },
        { _id: toObjectId(access_id) },
        { type: 9 },
        { is_active: true },
      ],
    });
    return theAccess;
  }
}
