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
import { HttpService } from "@nestjs/axios";
import { lastValueFrom } from "rxjs";
import { messages, sofreBaseUrl } from "src/helpers/constants";
import { toObjectId } from "src/helpers/functions";
import { OrderStatsService } from "src/features/order/service/R/stats.service";
import { OrderActionService } from "src/features/order/service/U/actions.service";
import { OrderOtherCreateService } from "src/features/order/service/C/other.service";

@Injectable()
export class CashBankService {
  constructor(
    @InjectModel("cash-bank")
    private readonly model: Model<CashBank>,
    @Inject(forwardRef(() => OrderStatsService))
    private readonly ordersStatsService: OrderStatsService,
    @Inject(forwardRef(() => OrderActionService))
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

  async closeCashBank(data: { complex_id: string; id: string }) {
    const { id, complex_id } = data || {};
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

    await this.orderOtherCreateService.uploadOrders();

    try {
      await lastValueFrom(
        this.httpService.put(
          `${sofreBaseUrl}/cash-bank/close/${process.env.COMPLEX_ID}/${id}`,
          {},
          {
            headers: {
              "api-key": process.env.SECRET,
            },
          }
        )
      );
    } catch (err) {
      throw new BadRequestException("ا درخواست بستن صندوق شما انجام نشد.");
    }

    theRecord.last_print = new Date();
    return await theRecord.save();
  }

  async updateData() {
    const res = await lastValueFrom(
      this.httpService.get(
        `${sofreBaseUrl}/cash-bank/localdb/${process.env.COMPLEX_ID}`,
        {
          headers: {
            "api-key": process.env.SECRET,
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
