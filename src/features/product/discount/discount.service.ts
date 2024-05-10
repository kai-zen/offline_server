import { Cron, CronExpression } from "@nestjs/schedule";
import { DiscountDocument } from "./discount.schema";
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { toObjectId } from "src/helpers/functions";
import { ActivityService } from "src/features/complex/activities/activities.service";
import { messages } from "src/helpers/constants";

@Injectable()
export class DiscountService {
  constructor(
    @InjectModel("discount")
    private readonly model: Model<DiscountDocument>,
    private readonly logService: ActivityService
  ) {}

  async findAll(complex: string, queryParams?: { [props: string]: string }) {
    const {
      limit = "30",
      page = "1",
      sort,
      direction = "asc",
    } = queryParams || {};

    const sortObj = {};
    if (sort) sortObj[sort] = direction === "asc" ? -1 : 1;

    const results = await this.model
      .find({ complex })
      .sort(sortObj)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate("folders products")
      .select("-complex")
      .exec();

    const totalDocuments = await this.model
      .find({ complex })
      .countDocuments()
      .exec();
    const numberOfPages = Math.ceil(totalDocuments / parseInt(limit));

    return {
      items: results,
      numberOfPages,
    };
  }

  async findAllComplexDiscounts(complex: string) {
    return await this.model.find({ complex }).exec();
  }

  async findAllActiveComplexDiscounts(complex_id: string) {
    return await this.model
      .find({
        $and: [
          { complex: toObjectId(complex_id) },
          { is_active: true },
          { start_date: { $lt: new Date() } },
          { expiration_date: { $gt: new Date() } },
        ],
      })
      .lean()
      .exec();
  }

  async findById(id: string) {
    return await this.model
      .findById(id)
      .populate("folders")
      .populate("products")
      .exec();
  }

  async create(data: {
    complex: string;
    percent: number;
    start_date: Date;
    expiration_date: Date;
    type: 1 | 2 | 3;
    products: string[];
    folders: string[];
    author_id: string;
  }) {
    const {
      complex,
      percent,
      start_date,
      expiration_date,
      type,
      products,
      folders,
      author_id,
    } = data || {};
    const newRecord = new this.model({
      percent,
      start_date,
      expiration_date,
      complex: toObjectId(complex),
      type,
      products: type === 3 ? products : [],
      folders: type === 2 ? folders : [],
    });
    await this.logService.create({
      type: 1,
      description: `${percent} درصد تخفیف اضافه شد.`,
      complex_id: complex,
      user_id: author_id,
      dist: newRecord,
      dist_type: "discount",
    });
    return await newRecord.save();
  }

  async findAndEdit(data: {
    id: string;
    body: {
      percent: number;
      start_date: Date;
      expiration_date: Date;
    };
    author_id: string;
  }) {
    const { author_id, body, id } = data;
    const { percent, start_date, expiration_date } = body || {};
    const theRecord = await this.model.findById(id);
    if (!theRecord) throw new NotFoundException();
    theRecord.percent = percent;
    theRecord.start_date = start_date;
    theRecord.expiration_date = expiration_date;
    await this.logService.create({
      type: 2,
      description: "تخفیف ویرایش شد.",
      complex_id: theRecord.complex._id.toString(),
      user_id: author_id,
      dist: theRecord,
      dist_type: "discount",
    });
    return await theRecord.save();
  }

  async toggleActivation(data: { id: string; author_id: string }) {
    const { author_id, id } = data;
    const theRecord = await this.model.findById(id);
    if (!theRecord) throw new NotFoundException();
    const newVal = !theRecord.is_active;
    theRecord.is_active = newVal;
    await this.logService.create({
      type: 2,
      description: `تخفیف ${newVal ? "فعال" : "غیرفعال"} شد.`,
      complex_id: theRecord.complex._id.toString(),
      user_id: author_id,
      dist: theRecord,
      dist_type: "discount",
    });
    return await theRecord.save();
  }

  async deleteOne(data: { id: string; author_id: string }) {
    const { author_id, id } = data;
    const theRecord = await this.model.findById(id);
    if (!theRecord) throw new NotFoundException(messages[404]);
    await this.logService.create({
      type: 3,
      description: "تخفیف حذف شد.",
      complex_id: theRecord.complex._id.toString(),
      user_id: author_id,
    });
    await this.model.deleteOne({ _id: id });
    return "success";
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM, {
    name: "product-discounts-cron",
    timeZone: "Asia/Tehran",
  })
  async handleCron() {
    await this.model.deleteMany({ expiration_date: { $lte: new Date() } });
  }
}
