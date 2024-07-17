import { EventsGateway } from "src/websocket/events.gateway";
import { InjectModel } from "@nestjs/mongoose";
import { messages } from "src/helpers/constants";
import { Model } from "mongoose";
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from "@nestjs/common";
import { CashBankService } from "src/features/complex/cash-bank/cash-bank.service";
import { OrderDocument } from "../../order.schema";

@Injectable()
export class OrderEditPaymentAndStatusService {
  constructor(
    @InjectModel("order")
    private readonly model: Model<OrderDocument>,
    private readonly eventsGateway: EventsGateway,
    @Inject(forwardRef(() => CashBankService))
    private readonly cashBankService: CashBankService
  ) {}

  async findAndEdit(data: {
    id: string;
    body: {
      status?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
      payment_type?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
      cash_bank?: string;
    };
  }) {
    const { body, id } = data;
    const { status, payment_type, cash_bank } = body || {};
    const theRecord = await this.model
      .findById(id)
      .populate("products.product")
      .populate("complex")
      .populate("user")
      .populate("complex_user", "name")
      .exec();
    if (!theRecord) throw new NotFoundException(messages[404]);

    if (theRecord.status > 4)
      throw new BadRequestException(
        "امکان ویرایش فقط برای سفارشات فعال وجود دارد."
      );

    let socketMessage = "";
    let theCashBank = null;
    if (cash_bank) {
      theCashBank = await this.cashBankService.findById(cash_bank);
      if (!theCashBank)
        throw new NotFoundException("صندوق مورد نظر شما وجود ندارد.");
    }

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
      if (!cash_bank)
        throw new BadRequestException(
          "انتخاب صندوق برای ویرایش شیوه پرداخت الزامی است."
        );

      const oldPaymentType = theRecord.payment_type;
      if (
        oldPaymentType !== payment_type &&
        payment_type > 1 &&
        !theRecord.payed_at
      ) {
        theRecord.payed_at = new Date();
        theRecord.on_hold = false;
      }
      theRecord.payment_type = payment_type;
      if (theCashBank && !theRecord.cash_bank)
        theRecord.cash_bank = theCashBank;
    }

    const oldStatus = theRecord.status;
    if (status) {
      if (!theRecord.cash_bank && status === 5) {
        if (!theCashBank)
          throw new BadRequestException(
            "انتخاب صندوق برای تحویل سفارش الزامی است."
          );
        else theRecord.cash_bank = theCashBank;
      }
      theRecord.status = status;
      if (oldStatus > 1 && [6, 7].includes(status))
        socketMessage = `فاکتور ${theRecord.factor_number} لغو شد.`;
      if (oldStatus === 1 && status === 2) socketMessage = "created";
    }

    const complex_id = theRecord.complex._id.toString();
    const theOrder = await theRecord.save();

    // websocket
    if (theOrder.status > 1 || oldStatus > 1 || theOrder.table_number)
      await this.eventsGateway.changeOrder({
        order: theOrder,
        complex_id,
        message: socketMessage,
      });
    return "success";
  }

  async changePayment(data: {
    id: string;
    body: {
      payment_type: 1 | 2 | 3 | 4 | 5 | 6 | 7;
      cash_bank?: string;
    };
    author_id: string;
  }) {
    const { body, id } = data;
    const { payment_type, cash_bank } = body || {};
    const theRecord = await this.model
      .findById(id)
      .populate("products.product")
      .populate("complex")
      .populate("user")
      .populate("complex_user", "name")
      .exec();
    if (!theRecord) throw new NotFoundException(messages[404]);

    if (theRecord.status > 4)
      throw new BadRequestException(
        "امکان ویرایش فقط برای سفارشات فعال وجود دارد."
      );

    let theCashBank = null;
    if (cash_bank) {
      theCashBank = await this.cashBankService.findById(cash_bank);
      if (!theCashBank)
        throw new NotFoundException("صندوق مورد نظر شما وجود ندارد.");
    }

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
      if (!cash_bank)
        throw new BadRequestException(
          "انتخاب صندوق برای ویرایش شیوه پرداخت الزامی است."
        );

      const oldPaymentType = theRecord.payment_type;
      if (
        oldPaymentType !== payment_type &&
        payment_type > 1 &&
        !theRecord.payed_at
      ) {
        theRecord.payed_at = new Date();
        theRecord.on_hold = false;
      }
      theRecord.payment_type = payment_type;
      if (theCashBank && !theRecord.cash_bank)
        theRecord.cash_bank = theCashBank;
    }

    const complex_id = theRecord.complex._id.toString();
    const theOrder = await theRecord.save();

    // websocket
    if (theRecord.status > 1 || theOrder.table_number)
      await this.eventsGateway.changeOrder({
        order: theOrder,
        complex_id,
      });

    return "success";
  }

  async changeStatus(data: { id: string; status: 1 | 2 | 3 | 4 | 5 | 6 | 7 }) {
    const { status, id } = data;
    const theRecord = await this.model
      .findById(id)
      .populate("products.product")
      .populate("complex")
      .populate("user")
      .populate("complex_user", "name")
      .exec();
    if (!theRecord) throw new NotFoundException(messages[404]);

    if (theRecord.status > 4)
      throw new BadRequestException(
        "امکان ویرایش فقط برای سفارشات فعال وجود دارد."
      );

    let socketMessage = "";

    const oldStatus = theRecord.status;
    if (!theRecord.cash_bank && status === 5)
      throw new BadRequestException(
        "انتخاب صندوق برای تحویل سفارش الزامی است."
      );

    theRecord.status = status;
    if (oldStatus > 1 && [6, 7].includes(status)) {
      socketMessage = `فاکتور ${theRecord.factor_number} لغو شد.`;
    }
    if (oldStatus === 1 && status === 2) socketMessage = "created";

    const complex_id = theRecord.complex._id.toString();
    const theOrder = await theRecord.save();

    // websocket
    if (theOrder.status > 1 || oldStatus > 1 || theOrder.table_number)
      await this.eventsGateway.changeOrder({
        order: theOrder,
        complex_id,
        message: socketMessage,
      });
    return "success";
  }
}
