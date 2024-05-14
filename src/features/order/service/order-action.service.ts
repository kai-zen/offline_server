import { EventsGateway } from "src/websocket/events.gateway";
import { InjectModel } from "@nestjs/mongoose";
import { messages, sofreBaseUrl } from "src/helpers/constants";
import { Model } from "mongoose";
import { OrderDocument } from "../order.schema";
import { toObjectId } from "src/helpers/functions";
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from "@nestjs/common";
import { CashBankService } from "src/features/complex/cash-bank/cash-bank.service";
import { Cron, CronExpression } from "@nestjs/schedule";
import { AccessService } from "src/features/user/access/access.service";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom } from "rxjs";

@Injectable()
export class OrderActionService {
  constructor(
    @InjectModel("order")
    private readonly model: Model<OrderDocument>,
    private readonly eventsGateway: EventsGateway,
    private readonly accessService: AccessService,
    @Inject(forwardRef(() => CashBankService))
    private readonly cashBankService: CashBankService,
    private readonly httpService: HttpService
  ) {}

  async findAndEdit(data: {
    id: string;
    body: {
      status?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
      complex_description?: string;
      payment_type?: 1 | 2 | 3 | 4 | 5 | 6;
      cash_bank?: string;
    };
    author_id: string;
  }) {
    const { body, id } = data;
    const { status, complex_description, payment_type, cash_bank } = body || {};
    const theRecord = await this.model
      .findById(id)
      .populate("products.product")
      .populate("complex")
      .populate("user")
      .exec();
    if (!theRecord) throw new NotFoundException();

    if (theRecord.status > 4)
      throw new BadRequestException(
        "امکان ویرایش فقط برای سفارشات فعال وجود دارد."
      );

    if (payment_type) {
      if (theRecord.status === 1 && payment_type !== 2)
        throw new BadRequestException(
          "پیش از تغییر شیوه پرداخت، وضعیت سفارش را از ثبت شده تغییر دهید."
        );
      if (theRecord.payment_type === 6)
        throw new BadRequestException(
          "امکان تغییر شیوه پرداخت سفارشی که به صورت نسیه ثبت شده وجود ندارد."
        );
      if (theRecord.payment_type === 2)
        throw new BadRequestException(
          "سفارشی که از طریق درگاه پرداخت شده باشد امکان ویرایش شیوه پرداخت ندارد."
        );
      if (theRecord.payment_type !== 1 && payment_type === 1)
        throw new BadRequestException(
          "امکان تغییر شیوه پرداخت سفارشی که پرداخت شده، به پرداخت نشده وجود ندارد."
        );
      const theCashBank = await this.cashBankService.findById(cash_bank);
      if (!theCashBank)
        throw new NotFoundException("صندوق مورد نظر شما وجود ندارد.");

      if (payment_type === 6 && !theRecord.user?._id)
        throw new BadRequestException(
          "کاربر سفارشی که قصد تغییر وضعیت پرداخت آن به نسیه را دارید، نامشخص است."
        );

      theRecord.payment_type = payment_type;
      theRecord.cash_bank = theCashBank;
    }
    if (status) theRecord.status = status;
    if (!status && !payment_type)
      theRecord.complex_description = complex_description;

    const complex_id = theRecord.complex._id.toString();
    const theOrder = await theRecord.save();

    // websocket
    await this.eventsGateway.changeOrder({ order: theOrder, complex_id });

    return;
  }

  async editAddress(data: {
    order_id: string;
    complex_id: string;
    address: {
      name: string;
      description: string;
      latitude: number;
      longitude: number;
    } | null;
  }) {
    const { address, order_id, complex_id } = data;
    const theRecord = await this.model
      .findOne({
        _id: toObjectId(order_id),
        complex: toObjectId(complex_id),
      })
      .populate("products.product")
      .populate("complex")
      .populate("user")
      .exec();

    if (theRecord.status > 4)
      throw new BadRequestException(
        "امکان تغییر آدرس فقط برای سفارشات فعال وجود دارد."
      );

    if (!theRecord) throw new NotFoundException(messages[400]);
    if (address) {
      theRecord.needs_pack = true;
      theRecord.user_address = address;
    } else theRecord.user_address = null;

    const theOrder = await theRecord.save();

    // websocket
    await this.eventsGateway.changeOrder({ order: theOrder, complex_id });
    return theRecord;
  }

  async editDeliveryGuy(data: {
    order_id: string;
    complex_id: string;
    access_id: string;
  }) {
    const { access_id, order_id, complex_id } = data;
    const theRecord = await this.model
      .findOne({
        _id: toObjectId(order_id),
        complex: toObjectId(complex_id),
      })
      .populate("products.product")
      .populate("complex")
      .populate("user")
      .exec();

    if (theRecord.status > 4)
      throw new BadRequestException(
        "امکان تغییر پیک فقط برای سفارشات فعال وجود دارد."
      );

    if (!theRecord) throw new NotFoundException(messages[400]);

    const theDeliveryGuy = await this.accessService.findDeliveryGuy({
      access_id,
      complex_id,
    });
    if (!theDeliveryGuy) throw new NotFoundException(messages[404]);
    theRecord.delivery_guy = theDeliveryGuy;
    const theOrder = await theRecord.save();

    // websocket
    await this.eventsGateway.changeOrder({ order: theOrder, complex_id });
    return theRecord;
  }

  async editPrices(data: {
    order_id: string;
    new_values: {
      complex_id: string;
      shipping_price: number;
      packing_price: number;
      extra_price: number;
      user_discount: number;
    };
  }) {
    const { new_values, order_id } = data;
    const {
      extra_price,
      packing_price,
      shipping_price,
      user_discount,
      complex_id,
    } = new_values;
    const theRecord = await this.model
      .findOne({
        _id: toObjectId(order_id),
        complex: toObjectId(complex_id),
      })
      .populate("products.product")
      .populate("complex")
      .populate("user")
      .exec();

    if (theRecord.payment_type !== 1)
      throw new BadRequestException(
        "امکان تغییر فاکتور پرداخت شده وجود ندارد."
      );

    const items_before =
      theRecord.extra_price +
      theRecord.packing_price +
      theRecord.shipping_price +
      theRecord.user_discount;
    const items_after =
      extra_price + packing_price + shipping_price + user_discount;
    const diffrence = items_before - items_after;

    if (!theRecord) throw new NotFoundException(messages[400]);
    theRecord.extra_price = extra_price;
    theRecord.packing_price = packing_price;
    theRecord.shipping_price = shipping_price;
    theRecord.user_discount = user_discount;
    theRecord.total_price -= diffrence;
    const theOrder = await theRecord.save();

    // websocket
    await this.eventsGateway.changeOrder({ order: theOrder, complex_id });
    return theRecord;
  }

  @Cron(CronExpression.EVERY_3_HOURS, {
    name: "complex-activation-cron",
    timeZone: "Asia/Tehran",
  })
  async handleCron() {
    const res = await lastValueFrom(
      this.httpService.get(
        `${sofreBaseUrl}/order/last-added/${process.env.COMPLEX_ID}`
      )
    );
    const lastCreatedAt = new Date(res.data);
    const newOrders = await this.model
      .find({
        created_at: { $gt: lastCreatedAt },
      })
      .lean()
      .exec();

    await this.httpService.post(
      `${sofreBaseUrl}/order/last-added/${process.env.COMPLEX_ID}`,
      {
        complex_id: process.env.COMPLEX_ID,
        orders: newOrders,
      },
      {
        headers: {
          apiKey: process.env.COMPLEX_TOKEN,
        },
      }
    );
    return "success";
  }
}
