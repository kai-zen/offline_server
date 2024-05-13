import { HttpService } from "@nestjs/axios";
import { ComplexUserDocument } from "./complex-users.schema";
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Model, Types } from "mongoose";
import { lastValueFrom } from "rxjs";
import { OrderDocument } from "src/features/order/order.schema";
import ProductService from "src/features/product/product/product.service";
import { UserService } from "src/features/user/users/user.service";
import { sofreBaseUrl } from "src/helpers/constants";
import { toObjectId } from "src/helpers/functions";

@Injectable()
export class ComplexUsersService {
  constructor(
    @InjectModel("complex-user")
    private readonly model: Model<ComplexUserDocument>,
    private readonly userService: UserService,
    private readonly productService: ProductService,
    private readonly httpService: HttpService
  ) {}

  async findByUserAndComplexBrief(user_id: string, complex_id: string) {
    const result: ComplexUserDocument = await this.model.findOne({
      user: user_id,
      complex: complex_id,
    });
    if (!result) return { orders_quantity: 0, total_rates: 0, avg_rate: 0 };
    else {
      const rates = result.products.map((item) => item.rates).flat(1);
      const totalRates = rates.length;
      const totalPoints = rates.reduce(
        (accumulator, currentVal) => accumulator + currentVal,
        0
      );
      return {
        orders_quantity: result.orders.length,
        total_rates: totalRates,
        avg_rate: Number((totalPoints / totalRates).toFixed(1)) || 0,
      };
    }
  }

  async userLoggedIn(data: {
    user_id: string | Types.ObjectId;
    complex_id: string;
  }) {
    const { user_id, complex_id } = data || {};
    const theRecord = await this.model.findOne({
      user: user_id,
      complex: complex_id,
    });
    if (theRecord) return theRecord;

    const theUser = await this.userService.findById(user_id);
    if (!theUser) throw new UnauthorizedException();
    const newRecord = new this.model({
      user: theUser,
      complex: toObjectId(complex_id),
      orders: [],
      products: [],
    });
    return await newRecord.save();
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

  async updateData() {
    let hasMore = true;
    let page = 1;
    while (hasMore) {
      const res = await lastValueFrom(
        this.httpService.get(
          `${sofreBaseUrl}/complex-users/localdb/${process.env.COMPLEX_ID}/${page}`
        )
      );
      if (res.data && res.data.length > 0) {
        for await (const record of res.data) {
          const debtObjectIds = record.debt.map((d) => ({
            order: toObjectId(d.order),
            total: d.total,
          }));
          const ordersObjectIds = record.debt.map((o) => ({
            order: toObjectId(o.order),
            total: o.total,
          }));
          const productsObjectIds = record.products.map((p) => ({
            product: toObjectId(p.product),
            rates: p.rates,
            iteration: p.iteration,
          }));
          const modifiedResponse = {
            ...record,
            products: productsObjectIds,
            oders: ordersObjectIds,
            debt: debtObjectIds,
            _id: toObjectId(record._id),
            user: toObjectId(record.user),
            complex: toObjectId(record.complex),
          };
          await this.model.updateMany(
            { _id: modifiedResponse._id },
            { $set: modifiedResponse },
            { upsert: true }
          );
        }
        ++page;
      } else hasMore = false;
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM, {
    name: "ranges-update-cron",
    timeZone: "Asia/Tehran",
  })
  async handleCron() {
    await this.updateData();
  }
}
