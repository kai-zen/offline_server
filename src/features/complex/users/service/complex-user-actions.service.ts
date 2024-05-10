import ProductFetchService from "src/features/product/product/service/product-fetch.service";
import { ComplexFetchService } from "../../complex/service/comlex-fetch.service";
import { ComplexUserDocument } from "../complex-users.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { OrderDocument } from "src/features/order/order/order.schema";
import { UserService } from "src/features/user/users/user.service";
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ActivityService } from "../../activities/activities.service";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { toObjectId } from "src/helpers/functions";

@Injectable()
export class ComplexUsersActionsService {
  constructor(
    @InjectModel("complex-user")
    private readonly model: Model<ComplexUserDocument>,
    @InjectQueue("give_discount") private readonly queue: Queue,
    private readonly userService: UserService,
    private readonly complexService: ComplexFetchService,
    private readonly productService: ProductFetchService,
    private readonly logService: ActivityService
  ) {}

  async userLoggedIn(data: {
    user_id: string | Types.ObjectId;
    complex_id: string;
  }) {
    const { user_id, complex_id } = data || {};
    const doesItExist = await this.model.exists({
      user: user_id,
      complex: complex_id,
    });
    if (!doesItExist) {
      const theUser = await this.userService.findById(user_id);
      const theComplex = await this.complexService.findById(complex_id);
      if (!theUser || !theComplex) throw new UnauthorizedException();

      const newRecord = new this.model({
        user: theUser,
        complex: theComplex,
        orders: [],
        products: [],
      });
      return await newRecord.save();
    }
  }

  async addNewOrder(data: {
    products: { _id: string; quantity: number }[];
    order: OrderDocument;
    user_id: string | Types.ObjectId;
    complex_id: string;
  }) {
    const { user_id, complex_id, order, products } = data;

    // find order and complex-user
    let theRecord = await this.model.findOne({
      user: user_id,
      complex: complex_id,
    });
    if (!theRecord) {
      const addedRecord = await this.userLoggedIn({ user_id, complex_id });
      if (addedRecord) theRecord = addedRecord;
    }

    // increase used discounts
    if (order.user_discount > 0) ++theRecord.used_discounts;

    // add order and update last visit
    theRecord.orders.push({
      order,
      total: order.total_price,
    });
    theRecord.last_visit = new Date();

    // update complex-user products record
    for await (const product of products) {
      const productIndex = theRecord.products.findIndex(
        (item) => item.product?._id?.toString() === product?._id
      );
      if (productIndex === -1) {
        const fullData = await this.productService.findById(product?._id);
        if (!fullData) throw new NotFoundException("محصول مورد نظر پیدا نشد");
        theRecord.products.push({
          product: fullData,
          rates: [],
          iteration: product?.quantity || 1,
        });
      } else if (theRecord?.products?.[productIndex])
        theRecord.products[productIndex].iteration += product?.quantity;
    }
    return await theRecord.save();
  }

  async addComment(data: {
    complex_id: string;
    user_id: string;
    order: OrderDocument;
    rate: 1 | 2 | 3 | 4 | 5;
  }) {
    const { user_id, complex_id, rate, order } = data;
    const theRecord = await this.model.findOne({
      user: user_id,
      complex: complex_id,
    });

    if (!theRecord)
      throw new NotFoundException("محصول مورد نظر برای کاربر مربوظه پیدا نشد");

    const orderProducts = order.products.map((item) => item.product);
    orderProducts.forEach((orderProduct) => {
      const theIndex = theRecord.products.findIndex(
        (recordProduct) =>
          recordProduct.product._id.toString() === orderProduct._id.toString()
      );
      if (theIndex !== -1) theRecord?.products?.[theIndex]?.rates.push(rate);
    });
    await theRecord.save();
  }

  async giveDiscount(data: { complex_id: string; user_id: string }) {
    const { user_id, complex_id } = data;
    const theRecord = await this.model
      .findOne({
        user: user_id,
        complex: complex_id,
      })
      .populate("user", "mobile")
      .exec();

    if (theRecord) {
      theRecord.last_given_discount = new Date();
      ++theRecord.given_discounts;
      return await theRecord.save();
    }
  }

  async addDebt(data: {
    complex_id: string;
    user_id: string;
    theOrder: OrderDocument;
  }) {
    const { complex_id, user_id, theOrder } = data;
    // find order and complex-user
    let theRecord = await this.model.findOne({
      user: user_id,
      complex: complex_id,
    });
    if (!theRecord) {
      const addedRecord = await this.userLoggedIn({ user_id, complex_id });
      if (addedRecord) theRecord = addedRecord;
    }
    theRecord.debt.push({
      order: theOrder,
      total: theOrder.total_price,
    });
    return await theRecord.save();
  }

  async payDebt(data: {
    user_id: string; // this is user id, not complex user id!
    complex_id: string;
    order_ids: string[];
    author_id?: string;
  }) {
    const { complex_id, user_id, order_ids, author_id } = data;
    const theUser = await this.model
      .findOne({
        complex: toObjectId(complex_id),
        user: toObjectId(user_id),
      })
      .populate("user")
      .exec();
    if (!theUser) throw new NotFoundException("کاربر مورد نظر پیدا نشد.");
    const filteredDebts = theUser.debt.filter(
      (d) => !order_ids.includes(d.order._id.toString())
    );
    theUser.debt = filteredDebts;

    // log
    if (author_id)
      await this.logService.create({
        type: 2,
        description: `${order_ids.length} فاکتور پرداخت نشده از کاربر ${theUser.user.mobile} تسویه شد.`,
        complex_id,
        user_id: author_id,
        dist: theUser,
        dist_type: "complex-user",
      });
    return await theUser.save();
  }

  async sendMessage(data: {
    message: string;
    complex_id: string;
    users: { _id: string; message: string }[];
    author_id?: string;
  }) {
    const { complex_id, users, message, author_id } = data;

    if (author_id)
      await this.logService.create({
        type: 1,
        description: `تعداد ${users.length} پیامک ارسال شد.`,
        complex_id,
        user_id: author_id,
      });

    await this.queue.add({ users, complex_id, message });
    return "success";
  }
}
