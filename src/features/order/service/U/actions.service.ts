import { EventsGateway } from "src/websocket/events.gateway";
import { InjectModel } from "@nestjs/mongoose";
import { messages } from "src/helpers/constants";
import { Model, Types } from "mongoose";
import { toObjectId } from "src/helpers/functions";
import { UserService } from "src/features/user/users/user.service";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AccessService } from "src/features/user/access/access.service";
import { OrderDocument } from "../../order.schema";
import { Complex } from "src/features/complex/complex/complex.schema";
import { ComplexService } from "src/features/complex/complex/comlex.service";

@Injectable()
export class OrderActionService {
  constructor(
    @InjectModel("order")
    private readonly model: Model<OrderDocument>,
    private readonly userService: UserService,
    private readonly eventsGateway: EventsGateway,
    private readonly complexService: ComplexService,
    private readonly accessService: AccessService
  ) {}

  async printReceipt(data: { printer: any; receipt: any[] }) {
    await this.eventsGateway.printReceipt(data);
    return "success";
  }

  async toggleOnHold(order_id: string | Types.ObjectId) {
    const theRecord = await this.model
      .findById(order_id)
      .populate("products.product")
      .populate("complex")
      .populate("user")
      .exec();
    if (!theRecord) throw new NotFoundException(messages[404]);
    if (theRecord.payments?.length)
      throw new BadRequestException("این سفارش قبلا پرداخت شده است.");

    const currentVal = theRecord.on_hold;
    theRecord.on_hold = !currentVal;
    const theOrder = await theRecord.save();

    // websocket
    await this.eventsGateway.changeOrder({
      order: theOrder,
    });
    return theOrder;
  }

  async editAddress(data: {
    order_id: string;
    complex_id: string;
    address?: {
      address_id: string;
      name: string;
      description: string;
      latitude: number;
      longitude: number;
      details: string;
      phone_number: string;
    } | null;
    table_number?: string;
    shipping_price?: number;
    navigation_link?: string;
  }) {
    const {
      address,
      order_id,
      complex_id,
      table_number,
      shipping_price,
      navigation_link,
    } = data;
    let socketMessage = "";
    const theRecord = await this.model
      .findOne({
        _id: toObjectId(order_id),
        complex: toObjectId(complex_id),
      })
      .populate("products.product")
      .populate("complex")
      .populate("user")
      .exec();

    if (!theRecord) throw new NotFoundException(messages[400]);
    if (theRecord.status > 4)
      throw new BadRequestException(
        "امکان تغییر آدرس فقط برای سفارشات فعال وجود دارد."
      );

    const theComplex: Complex = await this.complexService.findTheComplex();

    if (address) {
      if (theRecord.table_number)
        socketMessage = `فاکتور ${theRecord.factor_number} از میز ${theRecord.table_number} تبدیل به یک سفارش ارسالی شد.`;
      else if (!theRecord.user_address?.description)
        socketMessage = `فاکتور ${theRecord.factor_number} از بیرون‌بر تبدیل به ارسالی شد.`;
      theRecord.user_address = {
        ...address,
        address_id: address
          ? address?.address_id
            ? (toObjectId(address.address_id) as any)
            : null
          : null,
      };
      theRecord.table_number = null;

      const packingDiff = (theComplex.packing || 0) - theRecord.packing_price;
      const shippingDiff = shipping_price - (theRecord.shipping_price || 0);

      const diff = packingDiff + (shippingDiff || 0) - theRecord.service;
      theRecord.packing_price = theComplex.packing || 0;
      theRecord.service = 0;
      theRecord.shipping_price = shipping_price || 0;
      theRecord.total_price += diff;
    }

    if (table_number) {
      if (theRecord.user_address?.description)
        socketMessage = `فاکتور ${theRecord.factor_number} از ارسالی، تبدیل به سفارش برای میز ${table_number} شد.`;
      else if (!theRecord.table_number)
        socketMessage = `فاکتور ${theRecord.factor_number} از بیرون‌بر، تبدیل به سفارش برای میز ${table_number} شد.`;

      theRecord.table_number = table_number
        ? Number(table_number.replace(/[^0-9]/g, ""))
        : null;
      theRecord.user_address = null;

      const serviceDiff = theComplex.service || 0 - theRecord.service;
      const diff =
        serviceDiff - theRecord.shipping_price - theRecord.packing_price;
      theRecord.total_price += diff;
      theRecord.shipping_price = 0;
      theRecord.packing_price = 0;
      theRecord.service = theComplex.service || 0;
    }

    if (!address && !table_number) {
      if (theRecord.table_number)
        socketMessage = `فاکتور ${theRecord.factor_number} از میز ${theRecord.table_number}، تبدیل به سفارش بیرون‌بر شد.`;
      else if (theRecord.user_address?.description)
        socketMessage = `فاکتور ${theRecord.factor_number} از ارسالی، تبدیل به سفارش بیرون‌بر شد.`;

      theRecord.table_number = null;
      theRecord.user_address = null;

      const packingDiff = (theComplex.packing || 0) - theRecord.packing_price;
      const diff = packingDiff - theRecord.service - theRecord.shipping_price;
      theRecord.total_price += diff;
      theRecord.shipping_price = 0;
      theRecord.service = 0;
    }
    theRecord.navigation_link = navigation_link || "";

    const theOrder = await theRecord.save();
    // websocket
    await this.eventsGateway.changeOrder({
      order: theOrder,
      message: socketMessage,
    });
    return theOrder;
  }

  async changePeopleCount(
    order_id: string | Types.ObjectId,
    peopleCount: number | null
  ) {
    const theRecord = await this.model
      .findById(order_id)
      .populate("products.product")
      .populate("complex")
      .populate("user")
      .exec();
    if (!theRecord) throw new NotFoundException(messages[404]);
    theRecord.people_count = Number(peopleCount);
    const theOrder = await theRecord.save();
    // websocket
    await this.eventsGateway.changeOrder({
      order: theOrder,
    });
    return theOrder;
  }

  async modifyUser(data: {
    mobile: string;
    order_id: string;
    complex_id: string;
  }) {
    const { complex_id, order_id, mobile } = data;

    if (mobile?.length !== 11 || !mobile.startsWith("09"))
      throw new BadRequestException("شماره همراه وارد شده اشتباه است.");

    const theRecord = await this.model
      .findOne({
        complex: toObjectId(complex_id),
        _id: toObjectId(order_id),
      })
      .populate("products.product")
      .populate("complex")
      .populate("user")
      .exec();

    if (!theRecord) throw new NotFoundException("سفارش مربوطه پیدا نشد.");
    if (theRecord.payments?.length)
      throw new BadRequestException(
        "امکان ویرایش مشتری برای سفارشات پرداخت شده وجود ندارد."
      );
    if (theRecord.status > 4)
      throw new BadRequestException(
        "امکان ویرایش مشتری فقط برای سفارشات فعال وجود دارد."
      );

    let theUser = await this.userService.findByMobile(mobile);
    if (!theUser) theUser = await this.userService.createUser(mobile);
    if (!theUser) throw new NotFoundException("مشتری پیدا نشد!");

    theRecord.user = theUser;
    theRecord.user_phone = mobile;

    const theOrder = await theRecord.save();
    // websocket
    await this.eventsGateway.changeOrder({
      order: theOrder,
    });
    return theOrder;
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
    await this.eventsGateway.changeOrder({ order: theOrder });
    return theRecord;
  }

  async editPrices(data: {
    order_id: string;
    new_values: {
      complex_id: string;
      shipping_price: number;
      extra_price: number;
      user_discount: number;
      tip: number;
    };
  }) {
    const { new_values, order_id } = data;
    const { extra_price, shipping_price, complex_id, tip } = new_values;
    let { user_discount } = new_values;

    const theRecord = await this.model
      .findOne({
        _id: toObjectId(order_id),
        complex: toObjectId(complex_id),
      })
      .populate("products.product")
      .populate("complex")
      .populate("user")
      .exec();

    if (!theRecord) throw new NotFoundException(messages[404]);
    if (theRecord.status > 4)
      throw new BadRequestException(
        "امکان ویرایش تنها برای سفارشات فعال وجود دارد."
      );

    const maxDiscount = theRecord.complex.discount_limit
      ? theRecord.complex.discount_limit *
        ((theRecord.total_price + theRecord.user_discount) / 100)
      : null;
    user_discount = maxDiscount
      ? maxDiscount > user_discount
        ? user_discount
        : maxDiscount
      : user_discount;

    const items_before =
      theRecord.extra_price +
      theRecord.shipping_price +
      (theRecord.tip || 0) -
      theRecord.user_discount;
    const items_after =
      extra_price + shipping_price + (tip || 0) - user_discount;
    const difference = items_before - items_after;

    theRecord.extra_price = extra_price;
    theRecord.shipping_price = shipping_price;
    theRecord.user_discount = user_discount;
    theRecord.tip = tip;
    theRecord.total_price -= difference;
    const theOrder = await theRecord.save();

    // websocket
    await this.eventsGateway.changeOrder({ order: theOrder });

    return theRecord;
  }
}
