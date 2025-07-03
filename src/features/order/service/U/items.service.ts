import { EventsGateway } from "src/websocket/events.gateway";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { BadRequestException, Injectable } from "@nestjs/common";
import { findItemByPriceId, toObjectId } from "src/helpers/functions";
import { messages } from "src/helpers/constants";
import { OrderDocument } from "../../order.schema";
import { OrderThirdMethodsService } from "../helpers.service";

@Injectable()
export class OrderEditItemsService {
  constructor(
    @InjectModel("order")
    private readonly model: Model<OrderDocument>,
    private readonly eventsGateway: EventsGateway,
    private readonly orderThirdMethods: OrderThirdMethodsService
  ) {}

  async modifyItems(data: {
    products: { product_id: string; quantity: number; price_index: number }[];
    complex_id: string;
    order_id: string;
    description: string;
  }) {
    const { products, complex_id, order_id, description } = data || {};

    const theRecord = await this.model
      .findOne({
        _id: toObjectId(order_id),
        complex: toObjectId(complex_id),
      })
      .populate("products.product")
      .populate("user", "name mobile")
      .exec();
    if (!theRecord) throw new BadRequestException(messages[404]);
    if (theRecord?.status > 4)
      throw new BadRequestException(
        "امکان اضافه کردن موارد جدید فقط روی سفارشات فعال و حضوری وجود دارد."
      );

    // validate complex activation and workhours
    const theComplex = await this.orderThirdMethods.isValidCreateRequest();

    const productsFullData =
      await this.orderThirdMethods.productDataHandler(products);

    const { products_price, packing_price, complex_discount } =
      await this.orderThirdMethods.priceHandler({
        products: productsFullData,
        complex_packing_price: theComplex.packing,
      });
    const tax = (theComplex.tax * products_price) / 100;
    const servicePrice = theRecord.service;
    const packingPrice = theRecord?.table_number ? 0 : packing_price;

    // **complex discount is calculated in productsprice**
    const allExpences =
      products_price +
      packingPrice +
      theRecord.shipping_price +
      tax +
      servicePrice;

    const before = [
      ...(theRecord.toObject ? theRecord.toObject() : theRecord).products,
    ];
    const after = [...productsFullData];
    const combined = [];
    before.forEach((item) => {
      const afterItem = findItemByPriceId(after, item.price.price_id);
      if (afterItem)
        combined.push({
          ...item,
          quantity: afterItem.quantity,
          diff: afterItem.quantity - item.quantity,
        });
      else combined.push({ ...item, quantity: 0, diff: item.quantity * -1 });
    });

    after.forEach((item) => {
      const beforeItem = findItemByPriceId(before, item.price.price_id);
      if (!beforeItem) combined.push({ ...item, diff: item.quantity });
    });

    theRecord.products = productsFullData;
    theRecord.packing_price = packingPrice;
    theRecord.total_price = allExpences;
    theRecord.complex_discount = complex_discount;
    theRecord.tax = tax;

    const edited_order = await theRecord.save();
    const copy = { ...edited_order.toObject() };

    const hasDescChanged = theRecord.description !== description && description;
    if (hasDescChanged) theRecord.description = description || "";
    const socketMessage = hasDescChanged
      ? `موارد و توضیحات فاکتور ${theRecord.factor_number} اصلاح شد.`
      : `موارد فاکتور ${theRecord.factor_number} اصلاح شد.`;

    // websocket
    await this.eventsGateway.changeOrder({
      order: { ...copy, products: combined } as OrderDocument,
      message: socketMessage,
    });
    return edited_order;
  }
}
