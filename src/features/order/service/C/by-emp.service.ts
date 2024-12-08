import { EventsGateway } from "src/websocket/events.gateway";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { UserDocument } from "src/features/user/users/user.schema";
import { UserService } from "src/features/user/users/user.service";
import { Injectable } from "@nestjs/common";
import { p2e, toObjectId } from "src/helpers/functions";
import { OrderDocument } from "../../order.schema";
import { OrderThirdMethodsService } from "../helpers.service";
import { AreaService } from "src/features/complex/area/area.service";

@Injectable()
export class OrderCreateService {
  constructor(
    @InjectModel("order")
    private readonly model: Model<OrderDocument>,
    private readonly userService: UserService,
    private readonly eventsGateway: EventsGateway,
    private readonly orderThirdMethods: OrderThirdMethodsService,
    private readonly areaService: AreaService
  ) {}

  async createByEmployee(data: {
    order_type: 1 | 2 | 3;
    description: string;
    products: { product_id: string; quantity: number; price_index: number }[];
    complex_id: string;
    cashbank_id: string;
    tip?: number;
    user_address?: {
      address_id: string;
      name: string;
      description: string;
      details: string;
      latitude: number;
      longitude: number;
      phone_number: string;
    };
    delivery_time?: number | null;
    shipping_price?: number;
    extra_price?: number;
    user_discount?: number;
    user_phone?: string;
    table_number?: string;
    navigation_link?: string;
  }) {
    const {
      order_type,
      user_address,
      user_phone,
      products,
      description,
      complex_id,
      table_number,
      cashbank_id,
      extra_price,
      delivery_time,
      navigation_link,
      tip,
    } = data || {};
    let { shipping_price, user_discount } = data;

    let theUser: UserDocument | null = null;
    if (
      user_phone &&
      user_phone.length === 11 &&
      user_phone?.startsWith("09")
    ) {
      theUser = await this.userService.findByMobile(user_phone);
      if (!theUser) theUser = await this.userService.createUser(user_phone);
    }

    // validate complex activation and workhours
    const theComplex = await this.orderThirdMethods.isValidCreateRequest();

    const theArea = table_number
      ? await this.areaService.findRelatedArea({
          complex_id,
          table_number: Number(table_number),
        })
      : null;

    const productsFullData =
      await this.orderThirdMethods.productDataHandler(products);

    const theRange =
      user_address?.latitude && user_address?.longitude
        ? await this.orderThirdMethods.shippingRangeHandler({
            complex_id,
            user_address,
          })
        : null;

    // calculate different prices
    if (typeof shipping_price !== "number")
      shipping_price = Boolean(!user_address?.description || table_number)
        ? 0
        : theRange?.price || 0;

    const { products_price, packing_price, complex_discount } =
      await this.orderThirdMethods.priceHandler({
        products: productsFullData,
        complex_packing_price: theComplex.packing,
      });

    const tax = (theComplex.tax * products_price) / 100;

    const servicePrice = Boolean(table_number) ? theComplex.service || 0 : 0;
    const packingPrice = table_number ? 0 : packing_price || 0;

    const factor_number = await this.orderThirdMethods.factorNumber(complex_id);

    // **complex discount is calculated in productsprice**
    const allExpences =
      products_price +
      packingPrice +
      (extra_price || 0) +
      shipping_price +
      tax +
      (tip || 0) +
      servicePrice;

    const maxDiscount = theComplex.discount_limit
      ? theComplex.discount_limit * (allExpences / 100)
      : null;
    user_discount = maxDiscount
      ? maxDiscount > user_discount
        ? user_discount
        : maxDiscount
      : user_discount;

    const newRecord = new this.model({
      order_type,
      description,
      user: theUser?._id || null,
      user_address: user_address
        ? {
            ...user_address,
            address_id: user_address?.address_id
              ? toObjectId(user_address.address_id)
              : null,
          }
        : null,
      payments: [],
      user_phone,
      products: productsFullData,
      shipping_price,
      packing_price: packingPrice,
      total_price: allExpences - (user_discount || 0),
      complex_discount,
      complex: theComplex,
      user_discount: user_discount || 0,
      area: theArea || null,
      table_number: table_number
        ? Number(p2e(table_number).replace(/[^0-9]/g, ""))
        : null,
      factor_number,
      extra_price: extra_price || 0,
      tax,
      service: servicePrice,
      cash_bank: cashbank_id ? toObjectId(cashbank_id) : null,
      created_at: new Date(),
      status: 2,
      delivery_time,
      submitted_offline: true,
      navigation_link: navigation_link || "",
      tip: tip || 0,
    });
    const created_order = await newRecord.save();

    // websocket
    const completedData = await this.model.populate(created_order, [
      { path: "user", select: "name mobile" },
    ]);
    await this.eventsGateway.addOrder(completedData);

    return created_order;
  }
}
