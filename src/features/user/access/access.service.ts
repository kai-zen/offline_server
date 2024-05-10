import { Model, PipelineStage, Types } from "mongoose";
import { AccessDocument } from "./access.schema";
import { InjectModel } from "@nestjs/mongoose";
import { UserService } from "../users/user.service";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ComplexFetchService } from "src/features/complex/complex/service/comlex-fetch.service";
import { messages } from "src/helpers/constants";
import { toObjectId } from "src/helpers/functions";

@Injectable()
export class AccessService {
  constructor(
    @InjectModel("access")
    private readonly model: Model<AccessDocument>,
    private readonly userService: UserService,
    private readonly complexSerivce: ComplexFetchService
  ) {}

  async findAll(queryParams: { [props: string]: string }) {
    const {
      limit = "8",
      page = "1",
      sort,
      direction = "asc",
      complex,
      search = "",
      type,
    } = queryParams || {};

    const searchRegex = new RegExp(`^${search}`, "i");
    const applyingLimit = parseInt(limit) || 12;

    const filters = {
      $and: [
        { type: type ? parseInt(type) : { $lte: 10 } },
        { complex: toObjectId(complex) },
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

  async findById(id: string) {
    return await this.model.findById(id).populate("user");
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

  async findByComplexAndUser(data: { username: string; user: string }) {
    const { user, username } = data;
    const theComplex = await this.complexSerivce.findByUsername(username);
    if (!theComplex) throw new NotFoundException(messages[404]);
    const theAccess = await this.model.findOne({
      $and: [{ complex: theComplex._id }, { user }],
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

  async create(data: { type: number; mobile: string; complex: string }) {
    const { type, mobile, complex } = data;
    let theUser = await this.userService.findByMobile(mobile);
    if (!theUser) theUser = await this.userService.createUser(mobile);

    const isItAlreadyDefined = await this.model.exists({
      $and: [{ user: theUser._id }, { complex }],
    });
    if (isItAlreadyDefined)
      throw new BadRequestException(
        "برای کاربری که قصد ساخت دسترسی برایش را دارید، دسترسی ازقبل وجود دارد. برای تغییر نقش وی، آن را ویرایش کنید."
      );

    const newRecord = new this.model({
      type,
      user: theUser._id,
      complex,
    });
    return await newRecord.save();
  }

  async findAndEdit(id: string, type: number) {
    const theAccess = await this.model.findById(id);
    if (type && type !== 1 && theAccess.type !== 1) theAccess.type = type;
    await theAccess.save();
  }

  async changeOwner(data: { complex_id: string; mobile: string }) {
    const { complex_id, mobile } = data;
    await this.deleteComplexOwner(data.complex_id);
    return await this.create({
      type: 1,
      mobile,
      complex: complex_id,
    });
  }

  async deleteComplexOwner(complex_id: string) {
    await this.model.deleteOne({
      $and: [{ complex: toObjectId(complex_id) }, { type: 1 }],
    });
    return "success";
  }

  async deleteOne(id: string) {
    await this.model.deleteOne({ $and: [{ _id: id }, { type: { $ne: 1 } }] });
    return "success";
  }
}
