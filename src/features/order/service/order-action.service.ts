import ProductActionsService from "src/features/product/product/service/product-actions.service";
import { ComplexPutService } from "src/features/complex/complex/service/complex-put.service";
import { EventsGateway } from "src/websocket/events.gateway";
import { InjectModel } from "@nestjs/mongoose";
import { messages } from "src/helpers/constants";
import { Model, Types } from "mongoose";
import { OrderDocument } from "../order.schema";
import { OrderThirdMethodsService } from "./third-methods.actions";
import { toObjectId } from "src/helpers/functions";
import { UserService } from "src/features/user/users/user.service";
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from "@nestjs/common";
import { ComplexUsersActionsService } from "src/features/complex/users/service/complex-user-actions.service";
import { CashBankService } from "src/features/complex/cash-bank/cash-bank.service";
import { Cron, CronExpression } from "@nestjs/schedule";
import { AccessService } from "src/features/user/access/access.service";

@Injectable()
export class OrderActionService {
  constructor(
    @InjectModel("order")
    private readonly model: Model<OrderDocument>,
    private readonly userService: UserService,
    private readonly eventsGateway: EventsGateway,
    private readonly productService: ProductActionsService,
    private readonly orderThirdMethods: OrderThirdMethodsService,
    private readonly complexPutService: ComplexPutService,
    private readonly complexUsersActionsService: ComplexUsersActionsService,
    private readonly accessService: AccessService,
    @Inject(forwardRef(() => CashBankService))
    private readonly cashBankService: CashBankService
  ) {}

  async modifyIsPayed(order_id: string | Types.ObjectId) {
    const theRecord = await this.model
      .findById(order_id)
      .populate("products.product")
      .populate("complex")
      .populate("user")
      .exec();
    if (!theRecord) throw new NotFoundException(messages[404]);
    if (theRecord.payment_type > 1)
      throw new BadRequestException("این سفارش قبلا پرداخت شده است.");

    const toPayPrice = theRecord.total_price - theRecord.user_discount;
    await this.complexPutService.updateBalance(
      theRecord.complex._id,
      toPayPrice
    );

    theRecord.payment_type = 2;
    const theOrder = await theRecord.save();

    // websocket
    await this.eventsGateway.changeOrder({
      order: theOrder,
      complex_id: theRecord.complex._id.toString(),
    });
    return theOrder;
  }

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
      if (!cash_bank)
        throw new BadRequestException(
          "انتخاب صندوق برای ویرایش شیوه پرداخت الزامی است."
        );
      const theCashBank = await this.cashBankService.findById(
        cash_bank,
        theRecord.complex._id.toString()
      );
      if (!theCashBank)
        throw new NotFoundException("صندوق مورد نظر شما وجود ندارد.");

      if (payment_type === 6)
        if (theRecord.user?._id)
          await this.complexUsersActionsService.addDebt({
            user_id: theRecord.user._id.toString(),
            complex_id: theRecord.complex._id.toString(),
            theOrder: theRecord,
          });
        else
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

    if (status === 5) {
      for await (const product of theRecord.products.map(
        (item) => item.product
      )) {
        await this.productService.addOrdersCount(product._id);
      }
      if (theRecord.user?._id)
        await this.userService.updateStats(
          theRecord.user._id,
          theRecord.total_price
        );
    }

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

  async cancelOrder(id: string, user_id: Types.ObjectId) {
    const theRecord = await this.model
      .findOne({
        _id: toObjectId(id),
        user: user_id,
      })
      .populate("products.product")
      .populate("complex")
      .populate("user")
      .exec();
    if (!theRecord) throw new NotFoundException();
    if (theRecord.status === 7 || theRecord.status === 6)
      throw new BadRequestException("سفارش شما لغو شده است.");
    if (theRecord.status !== 1)
      throw new BadRequestException(
        "امکان لغو سفارش به دلیل شروع فرایند آماده سازی وجود ندارد."
      );

    theRecord.status = 7;
    const theOrder = await theRecord.save();
    // websocket
    await this.eventsGateway.changeOrder({
      order: theOrder,
      complex_id: theRecord.complex?._id?.toString(),
    });

    return theOrder;
  }

  @Cron(CronExpression.EVERY_DAY_AT_5AM, {
    name: "complex-activation-cron",
    timeZone: "Asia/Tehran",
  })
  async handleCron() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    await this.model
      .deleteMany({
        created_at: { $lte: sevenDaysAgo },
        status: { $in: [1, 6, 7] },
      })
      .exec();
  }
}
