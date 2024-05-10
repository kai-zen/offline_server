import { Process, Processor } from "@nestjs/bull";
import { InjectModel } from "@nestjs/mongoose";
import { Job } from "bull";
import { Model } from "mongoose";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { messages } from "src/helpers/constants";
import { UserDocument } from "src/features/user/users/user.schema";
import { OrderDocument } from "./order.schema";
import { UserService } from "src/features/user/users/user.service";
import { AuthService } from "src/features/user/auth/auth.service";
import { OrderThirdMethodsService } from "./service/third-methods.actions";
import { CashBankService } from "src/features/complex/cash-bank/cash-bank.service";
import { ComplexUsersActionsService } from "src/features/complex/users/service/complex-user-actions.service";

@Processor("offline_orders")
export class OfflineOrdersProcessor {
  constructor(
    @InjectModel("order")
    private readonly model: Model<OrderDocument>,
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly orderThirdMethods: OrderThirdMethodsService,
    private readonly cashBankService: CashBankService,
    private readonly complexUsersActionsService: ComplexUsersActionsService
  ) {}

  @Process()
  async handleSubmitOrders(job: Job) {
    const { orders, complex_id } = job.data;
    for await (const order of orders) {
      await this.offlineOrderSubmitter({ complex_id, payload: order });
    }
    return "success";
  }

  async offlineOrderSubmitter(data: {
    complex_id: string;
    payload: {
      order_type: 1 | 2 | 3;
      payment_type: 1 | 2 | 3 | 4 | 5 | 6;
      status: 1 | 2 | 3 | 4 | 5 | 6 | 7;
      description: string;
      products: { product_id: string; quantity: number; price_index: number }[];
      needs_pack: boolean;
      user_address: {
        name: string;
        description: string;
        latitude: number;
        longitude: number;
      } | null;
      created_at: string;

      // prices
      shipping_price: number;
      packing_price: number;
      user_discount: number;
      extra_price: number;
      complex_discount: number;
      service: number;

      cashbank_id?: string;
      user_phone?: string;
      table_number?: string;
    };
  }) {
    const { complex_id, payload } = data;
    const {
      cashbank_id,
      created_at,
      description,
      extra_price,
      needs_pack,
      order_type,
      packing_price,
      payment_type,
      products,
      shipping_price,
      user_address,
      user_discount,
      table_number,
      user_phone,
      complex_discount,
      status,
      service,
    } = payload;

    let theUser: UserDocument | null;
    if (user_phone) {
      theUser = await this.userService.findByMobile(user_phone);
      if (!theUser) theUser = await this.authService.registerUser(user_phone);
    }

    // validate complex activation and workhours
    const theComplex =
      await this.orderThirdMethods.isValidCreateRequest(complex_id);

    const productsFullData =
      await this.orderThirdMethods.productDataHandler(products);

    const theCashBank = cashbank_id
      ? await this.cashBankService.findById(cashbank_id, complex_id)
      : null;
    if ((payment_type !== 1 && !theCashBank) || payment_type === 2)
      throw new BadRequestException(messages[400]);
    if (cashbank_id && !theCashBank)
      throw new NotFoundException("صندوق مورد نظر شما وجود ندارد.");

    const { products_price } = await this.orderThirdMethods.priceHandler({
      products: productsFullData,
      complex_packing_price: theComplex.packing,
      complex_id,
    });

    const tax = (theComplex.tax * products_price) / 100;

    const factor_number = await this.orderThirdMethods.factorNumber(complex_id);

    const newRecord = new this.model({
      status,
      order_type,
      payment_type,
      needs_pack,
      description,
      user: theUser?._id || null,
      user_address: user_address || null,
      user_phone,
      products: productsFullData,
      cash_bank: theCashBank || null,
      created_at,
      // prices
      shipping_price,
      packing_price,
      total_price:
        products_price +
        packing_price +
        shipping_price +
        tax +
        service +
        extra_price,
      extra_price,
      complex_discount,
      complex: theComplex,
      user_discount,
      table_number,
      factor_number,
      tax,
      service,
    });
    const created_order = await newRecord.save();

    // update stats
    if (theUser && status === 5)
      await this.orderThirdMethods.statsHandler({
        complex_id,
        created_order,
        products: productsFullData,
        user_id: theUser._id,
      });

    if (payment_type === 6 && created_order.total_price !== 0)
      await this.complexUsersActionsService.addDebt({
        user_id: theUser._id.toString(),
        complex_id,
        theOrder: created_order,
      });

    return created_order;
  }
}
