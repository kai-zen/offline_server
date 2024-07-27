import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CashBank } from "./cash-bank.schema";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom } from "rxjs";
import { messages, sofreBaseUrl } from "src/helpers/constants";
import { toObjectId } from "src/helpers/functions";
import { OrderStatsService } from "src/features/order/service/R/stats.service";
import { OrderOtherCreateService } from "src/features/order/service/C/other.service";

@Injectable()
export class CashBankService {
  constructor(
    @InjectModel("cash-bank")
    private readonly model: Model<CashBank>,
    private readonly ordersStatsService: OrderStatsService,
    private readonly orderOtherCreateService: OrderOtherCreateService,
    private readonly httpService: HttpService
  ) {}

  async findAll() {
    return await this.model.find().exec();
  }

  async findByComplex() {
    return await this.model.find().select("-complex").exec();
  }

  async findById(id: string) {
    return await this.model.findById(id);
  }

  async closeCashBank(data: { complex_id: string; id: string; token: string }) {
    const { id, complex_id, token } = data || {};
    const theRecord = await this.model.findOne({
      _id: toObjectId(id),
      complex: toObjectId(complex_id),
    });
    if (!theRecord) throw new NotFoundException(messages[404]);

    const hasOpen = await this.ordersStatsService.hasOpenOrders(complex_id, id);
    if (hasOpen)
      throw new BadRequestException(
        "پیش از بستن صندوق باید سفارشات پرداخت نشده تعیین وضعیت شوند."
      );

    try {
      await this.orderOtherCreateService.uploadOrders({
        cashbank_id: id,
        token,
      });
    } catch (err) {
      console.log(err, "cash-bank/close");
      throw new BadRequestException("درخواست بستن صندوق شما انجام نشد.");
    }

    theRecord.last_print = new Date();
    return await theRecord.save();
  }

  async updateData() {
    try {
      const res = await lastValueFrom(
        this.httpService.get(
          `${sofreBaseUrl}/cash-bank/localdb/${process.env.COMPLEX_ID}`,
          { headers: { "api-key": process.env.SECRET } }
        )
      );
      for await (const record of res.data || []) {
        const modifiedResponse = {
          ...record,
          _id: toObjectId(record._id),
          complex: toObjectId(record.complex),
        };
        await this.model.updateOne(
          { _id: modifiedResponse._id },
          { $set: modifiedResponse },
          { upsert: true }
        );
      }
    } catch (err) {
      console.log(err, "cash-bank/localdb");
    }
    return "success";
  }
}
