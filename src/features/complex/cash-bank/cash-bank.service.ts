import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CashBank } from "./cash-bank.schema";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom } from "rxjs";
import { sofreBaseUrl } from "src/helpers/constants";
import { toObjectId } from "src/helpers/functions";
import { OrderStatsService } from "src/features/order/service/order-stats.service";
import { OrderActionService } from "src/features/order/service/order-action.service";

@Injectable()
export class CashBankService {
  constructor(
    @InjectModel("cash-bank")
    private readonly model: Model<CashBank>,
    private readonly ordersStatsService: OrderStatsService,
    private readonly ordersActionService: OrderActionService,
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

  async closeCashBank(data: { complex_id: string; id: string }) {
    const { id, complex_id } = data || {};
    const theRecord = await this.model.findOne({
      _id: toObjectId(id),
      complex: toObjectId(complex_id),
    });
    if (!theRecord) return;
    const hasOpen = await this.ordersStatsService.hasOpenOrders(complex_id);
    if (hasOpen)
      throw new BadRequestException(
        "پیش از بستن صندوق باید سفارشات پرداخت نشده تعیین وضعیت شوند."
      );
    const newOrders = await this.ordersActionService.newOrders();
    if (newOrders.length > 0)
      throw new BadRequestException(
        "پیش از بستن صندوق باید سفارشات داخلی خود را روی سرور مرکزی آپلود کنید."
      );

    await lastValueFrom(
      this.httpService.put(
        `${sofreBaseUrl}/cash-bank/close/${process.env.COMPLEX_ID}/${id}`,
        {},
        {
          headers: {
            "api-key": process.env.COMPLEX_TOKEN,
          },
        }
      )
    );
    theRecord.last_print = new Date();
    return await theRecord.save();
  }

  async updateData() {
    const res = await lastValueFrom(
      this.httpService.get(
        `${sofreBaseUrl}/cash-bank/localdb/${process.env.COMPLEX_ID}`,
        {
          headers: {
            "api-key": process.env.COMPLEX_TOKEN,
          },
        }
      )
    );
    await this.model.deleteMany({});
    const modifiedResults = (res.data || []).map((record) => ({
      ...record,
      _id: toObjectId(record._id),
      complex: toObjectId(record.complex),
    }));
    await this.model.insertMany(modifiedResults);
  }
}
