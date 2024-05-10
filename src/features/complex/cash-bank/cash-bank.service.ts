import { toObjectId } from "src/helpers/functions";
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CashBank } from "./cash-bank.schema";
import { ActivityService } from "../activities/activities.service";
import { messages } from "src/helpers/constants";
import { OrderStatsService } from "src/features/order/order/service/order-stats.service";

@Injectable()
export class CashBankService {
  constructor(
    @InjectModel("cash-bank")
    private readonly model: Model<CashBank>,
    private readonly logService: ActivityService,
    @Inject(forwardRef(() => OrderStatsService))
    private readonly ordersStatsService: OrderStatsService
  ) {}

  async findByComplex(complex_id: string) {
    return await this.model
      .find({ complex: complex_id })
      .select("-complex")
      .exec();
  }

  async findById(id: string, complex_id: string) {
    return await this.model.findOne({
      _id: toObjectId(id),
      complex: toObjectId(complex_id),
    });
  }

  async create(data: { name: string; complex_id: string; author_id: string }) {
    const { name, complex_id, author_id } = data || {};
    const newRecord = new this.model({
      name,
      complex: toObjectId(complex_id),
      last_print: new Date(),
    });
    const createResult = await newRecord.save();
    await this.logService.create({
      complex_id,
      type: 1,
      description: "صندوق جدید ساخته شد.",
      user_id: author_id,
    });

    return createResult;
  }

  async editName(data: {
    name: string;
    complex_id: string;
    author_id: string;
    id: string;
  }) {
    const { id, name, complex_id, author_id } = data || {};
    const theRecord = await this.model.findOne({
      _id: toObjectId(id),
      complex: toObjectId(complex_id),
    });
    if (!theRecord) throw new NotFoundException(messages[404]);
    const before = theRecord.name;
    theRecord.name = name;
    await this.logService.create({
      complex_id,
      type: 1,
      description: "نام صندوق ویرایش شد.",
      user_id: author_id,
      before,
      after: name,
    });
    return await theRecord.save();
  }

  async closeCashBank(data: {
    complex_id: string;
    author_id: string;
    id: string;
  }) {
    const { id, complex_id, author_id } = data || {};
    const theRecord = await this.model.findOne({
      _id: toObjectId(id),
      complex: toObjectId(complex_id),
    });
    if (!theRecord) throw new NotFoundException(messages[404]);
    const hasOpen = await this.ordersStatsService.hasOpenOrders(complex_id);
    if (hasOpen)
      throw new BadRequestException(
        "پیش از بستن صندوق باید سفارشات پرداخت نشده تعیین وضعیت شوند."
      );

    theRecord.last_print = new Date();
    await this.logService.create({
      complex_id,
      type: 1,
      description: `${theRecord.name} بسته شد.`,
      user_id: author_id,
    });
    return await theRecord.save();
  }

  async deleteOne(data: { id: string; author_id: string; complex_id: string }) {
    const { author_id, id, complex_id } = data;
    const theRecord = await this.model.findOne({
      _id: toObjectId(id),
      complex: toObjectId(complex_id),
    });
    if (!theRecord) throw new NotFoundException(messages[404]);

    await this.model.deleteOne({
      _id: toObjectId(id),
      complex: toObjectId(complex_id),
    });

    await this.logService.create({
      complex_id: theRecord.complex._id.toString(),
      type: 3,
      description: "صندوق حذف شد.",
      user_id: author_id,
    });
    return "success";
  }
}
