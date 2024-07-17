import { toObjectId } from "src/helpers/functions";
import {
  BadRequestException,
  Inject,
  Injectable,
  forwardRef,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Shift } from "./shift.schema";
import { messages } from "src/helpers/constants";
import { OrderFetchService } from "src/features/order/service/R/fetch.service";

@Injectable()
export class ShiftService {
  constructor(
    @InjectModel("shift")
    private readonly model: Model<Shift>,
    @Inject(forwardRef(() => OrderFetchService))
    private readonly ordersFetchService: OrderFetchService
  ) {}

  async findByComplex(complex_id: string, params: { [props: string]: string }) {
    const { date, cashbank, cashier } = params;
    if (!date) throw new BadRequestException(messages[400]);

    const targetDate = new Date(date); // Replace with your desired date
    const startOfDay = new Date(targetDate).setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate).setHours(23, 59, 59, 999);

    const filters: any = [
      { complex: toObjectId(complex_id) },
      {
        end: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      },
    ];
    if (cashier) filters.push({ cashier: toObjectId(cashier) });
    if (cashbank) filters.push({ cashbank: toObjectId(cashbank) });

    return await this.model
      .find({ $and: filters })
      .select("-complex")
      .populate("cashier", "name image username")
      .populate("cashbank")
      .exec();
  }

  async findShiftOrders(
    shift_id: string,
    queryParams: { [props: string]: string }
  ) {
    const theRecord = await this.model.findById(shift_id);
    if (!theRecord) throw new BadRequestException("شیفت موردنظر شما پیدا نشد.");

    const orders = await this.ordersFetchService.findShiftOrders(
      theRecord,
      queryParams
    );

    return orders;
  }

  async findShiftDeliveryGuysReports(shift_id: string) {
    const theRecord = await this.model.findById(shift_id);
    if (!theRecord) throw new BadRequestException("شیفت موردنظر شما پیدا نشد.");

    const deliveryGuysReports =
      await this.ordersFetchService.findShiftDeliveryGuysReport(theRecord);

    return deliveryGuysReports;
  }

  async create(data: {
    complex_id: string;
    cashbank_id: string;
    start: Date;
    end: Date;
    details: { _id: number; quantity: number; amount: number }[];
    cashier_id?: string;
  }) {
    const { cashier_id, complex_id, end, start, cashbank_id, details } =
      data || {};

    const total_income = details
      .map((d) => d.amount)
      .reduce((accumulator, currentVal) => accumulator + currentVal, 0);
    const total_orders = details
      .map((d) => d.quantity)
      .reduce((accumulator, currentVal) => accumulator + currentVal, 0);

    const newRecord = new this.model({
      end,
      start,
      complex: toObjectId(complex_id),
      cashier: cashier_id ? toObjectId(cashier_id) : null,
      cashbank: toObjectId(cashbank_id),
      details,
      total_income,
      total_orders,
    });
    return await newRecord.save();
  }
}
