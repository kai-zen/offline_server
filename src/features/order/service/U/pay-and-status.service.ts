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

  async changeOrderStatus(data: {
    id: string;
    body: {
      status: 1 | 2 | 3 | 4 | 5 | 6 | 7;
      cash_bank?: string;
    };
  }) {
    const { body, id } = data;
    const { status, cash_bank } = body || {};

    if (!status) throw new BadRequestException(messages[400]);
    const theRecord = await this.model
      .findById(id)
      .populate("products.product")
      .populate("user")
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

    if (status === 5) {
      const totalPayments = (theRecord.payments || [])
        .map((p) => p.amount)
        .reduce((accumulator, currentVal) => accumulator + currentVal, 0);
      if (theRecord.total_price !== totalPayments)
        throw new BadRequestException(
          "برای تحویل سفارش باید مجموع پرداختی ها با مبلغ فاکتور برابر باشد."
        );

      if (!theRecord.cash_bank) {
        if (!theCashBank)
          throw new BadRequestException(
            "انتخاب صندوق برای تحویل سفارش الزامی است."
          );
        else theRecord.cash_bank = theCashBank;
      }
    }

    const oldStatus = theRecord.status;
    theRecord.status = status;

    if ([6, 7].includes(status))
      socketMessage = `فاکتور ${theRecord.factor_number} لغو شد.`;
    if (oldStatus === 1 && status === 2) {
      // تایید سفارش
      if (!theCashBank)
        throw new BadRequestException(
          "انتخاب صندوق برای تایید سفارش الزامی است."
        );
      if ((theRecord.payments?.[0] || {}).type === 2) {
        theRecord.payed_at = new Date();
        if (!theRecord.cash_bank) theRecord.cash_bank = theCashBank;
      }
      socketMessage = "created";
    }

    const theOrder = await theRecord.save();

    // websocket
    if (theOrder.status > 1 || oldStatus > 1 || theOrder.table_number)
      await this.eventsGateway.changeOrder({
        order: theOrder,
        message: socketMessage,
      });

    return "success";
  }

  async editPayment(data: {
    id: string;
    body: {
      cash_bank?: string;
      payments: { type: number; amount: number }[];
    };
  }) {
    const { body, id } = data;
    const { cash_bank, payments } = body || {};
    const theRecord = await this.model
      .findById(id)
      .populate("products.product")
      .populate("submitter")
      .populate("user")
      .populate("complex")
      .exec();
    if (!theRecord) throw new NotFoundException(messages[404]);

    const filteredPayments =
      (payments || []).filter(
        (p) =>
          typeof p.amount === "number" &&
          p.amount !== 0 &&
          [1, 2, 3, 4, 5, 6, 7].includes(p.type)
      ) || [];

    if (!filteredPayments?.length)
      throw new BadRequestException("شیوه پرداخت تعیین شده درست نیست.");
    if (theRecord.status === 1)
      throw new BadRequestException(
        "پیش از تغییر شیوه پرداخت، وضعیت سفارش را از ثبت شده تغییر دهید."
      );
    if (theRecord.status > 4)
      throw new BadRequestException(
        "امکان ویرایش پرداخت فقط برای سفارشات فعال وجود دارد."
      );

    const theCashBank =
      theRecord.cash_bank ||
      (cash_bank ? await this.cashBankService.findById(cash_bank) : null);
    if (!theCashBank) throw new NotFoundException("صندوق انتخاب نشده است.");

    const wantsToAddDebt =
      filteredPayments.findIndex((p) => p.type === 6) !== -1;
    if (wantsToAddDebt && !theRecord.user?._id)
      throw new BadRequestException(
        "مشتری سفارشی که قصد تغییر وضعیت پرداخت آن به نسیه را دارید، نامشخص است."
      );

    theRecord.payments = filteredPayments;
    theRecord.on_hold = false;
    if (!theRecord.payed_at) theRecord.payed_at = new Date();
    if (!theRecord.cash_bank) theRecord.cash_bank = theCashBank;

    const theOrder = await theRecord.save();

    // websocket
    await this.eventsGateway.changeOrder({
      order: theOrder,
    });
    return theOrder;
  }
}
