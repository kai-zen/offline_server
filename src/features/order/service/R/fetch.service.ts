import {
  Inject,
  Injectable,
  NotFoundException,
  Scope,
  forwardRef,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { REQUEST } from "@nestjs/core";
import { Request } from "express";
import { escapeRegex, toObjectId } from "src/helpers/functions";
import { messages } from "src/helpers/constants";
import { CashBankService } from "src/features/complex/cash-bank/cash-bank.service";
import { OrderDocument } from "../../order.schema";
import { productDataFormatter } from "../../helpers/functions";
import { ShiftDocument } from "src/features/complex/shift/shift.schema";
import { AccessService } from "src/features/user/access/access.service";
import { ComplexService } from "src/features/complex/complex/comlex.service";

@Injectable({ scope: Scope.REQUEST })
export class OrderFetchService {
  constructor(
    @InjectModel("order")
    private readonly model: Model<OrderDocument>,
    @Inject(REQUEST)
    private req: Request,
    @Inject(forwardRef(() => CashBankService))
    private readonly cashbankService: CashBankService,
    private readonly accessService: AccessService,
    private readonly complexService: ComplexService
  ) {}

  async findAll(queryParams: { [props: string]: string }) {
    const { limit = "12", page = "1" } = queryParams || {};
    const results = await this.model
      .find()
      .sort({ created_at: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate("products.product")
      .populate("complex")
      .populate("user")
      .lean()
      .exec();

    const totalDocuments = await this.model.find().countDocuments().exec();
    const numberOfPages = Math.ceil(totalDocuments / parseInt(limit));

    return {
      items: productDataFormatter(results),
      numberOfPages,
    };
  }

  async findComplexOrders(
    complex_id: string,
    queryParams: { [props: string]: string }
  ) {
    const {
      limit = "12",
      page = "1",
      status,
      search,
      payment,
      type,
      from,
      to,
      delivery_guy,
      orderType,
      // isPending,
    } = queryParams || {};

    const filters: any[] = [{ complex: complex_id }];
    if (status && !isNaN(Number(status)))
      filters.push({ status: Number(status) });
    if (payment) filters.push({ payment_type: Number(payment) });
    if (orderType)
      filters.push({ order_type: type === "1" ? 1 : type === "2" ? 2 : 3 });
    if (type)
      filters.push({
        order_type: type === "1" ? 1 : type === "2" ? 2 : 3,
      });
    if (from)
      filters.push({
        created_at: { $gt: new Date(from).setHours(0, 0, 0, 0) },
      });
    if (to)
      filters.push({
        created_at: { $lt: new Date(to).setHours(23, 59, 59, 999) },
      });
    if (search) {
      const cleanedSearch = search ? escapeRegex(search) : "";
      if (cleanedSearch)
        filters.push({ user_phone: { $regex: cleanedSearch } });
    }
    if (delivery_guy) filters.push({ delivery_guy });

    // if (isPending) applyingFilters.push({ status: { $in: [1, 2, 3] } });

    const results = await this.model
      .find({ $and: filters })
      .sort({ created_at: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate("products.product")
      .populate("user")
      .populate("cash_bank", "-complex")
      .select("-complex")
      .lean()
      .exec();

    const totalDocuments = await this.model
      .find({ $and: filters })
      .countDocuments()
      .exec();
    const numberOfPages = Math.ceil(totalDocuments / parseInt(limit));

    return {
      items: productDataFormatter(results),
      numberOfPages,
    };
  }

  async findCashbankOrders(cash_bank: string) {
    const theComplex = await this.complexService.findTheComplex();

    const theCashbank = await this.cashbankService.findById(cash_bank);
    if (!theCashbank) throw new NotFoundException(messages[404]);

    const filters: any[] = [
      { cash_bank: theCashbank._id },
      { payed_at: { $gte: new Date(theCashbank.last_print) } },
    ];
    if (theComplex?.last_orders_update)
      filters.push({ created_at: { $gt: theComplex.last_orders_update } });

    const results = await this.model
      .find({ $and: filters })
      .sort({ created_at: -1 })
      .populate("products.product")
      .populate("user")
      .populate("cash_bank", "-complex")
      .select("-complex")
      .lean()
      .exec();

    return productDataFormatter(results);
  }

  async findShiftOrders(
    shift: ShiftDocument,
    queryParams: { [props: string]: string }
  ) {
    const { limit = "12", page = "1" } = queryParams || {};
    const filters: any[] = [
      {
        complex: shift.complex._id,
        cash_bank: shift.cashbank._id,
        payed_at: { $gte: shift.start, $lte: shift.end },
      },
    ];

    const results = await this.model
      .find({ $and: filters })
      .sort({ created_at: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate("products.product")
      .populate("user")
      .lean()
      .exec();

    const totalDocuments = await this.model
      .find({ $and: filters })
      .countDocuments()
      .exec();
    const numberOfPages = Math.ceil(totalDocuments / parseInt(limit));

    return {
      items: productDataFormatter(results),
      numberOfPages,
    };
  }

  async findShiftDeliveryGuysReport(shift: ShiftDocument) {
    const deliveryGuys = await this.accessService.findDeliveryGuys(
      shift.complex._id
    );

    const formattedData: any[] = [];
    for await (const dg of deliveryGuys) {
      const orders = await this.model
        .find({
          $and: [
            { complex: shift.complex._id },
            { cash_bank: shift.cashbank._id },
            { payed_at: { $gte: shift.start, $lte: shift.end } },
            { delivery_guy: dg._id },
          ],
        })
        .lean()
        .exec();

      const total_count = orders.length;
      const total_shipping_price = orders
        .map((o) => o.shipping_price)
        .reduce((accumulator, currentVal) => accumulator + currentVal, 0);

      formattedData.push({
        ...dg,
        total_count,
        total_shipping_price,
      });
    }

    return formattedData;
  }

  async findComplexLiveOrders() {
    const theComplex = await this.complexService.findTheComplex();
    const filters: any[] = [{ status: { $lt: 5 } }];
    if (theComplex?.last_orders_update)
      filters.push({ created_at: { $gt: theComplex.last_orders_update } });

    const results = await this.model
      .find({ $and: filters })
      .sort({ created_at: -1 })
      .populate("products.product")
      .populate("delivery_guy")
      .populate("user")
      .lean()
      .exec();
    return productDataFormatter(results);
  }

  async todayCount(complex_id: string) {
    const todayOrdersCount = await this.model
      .find({
        $and: [
          { complex: toObjectId(complex_id) },
          {
            created_at: {
              $gte: new Date().setHours(0, 0, 0, 0),
              $lte: new Date().setHours(23, 59, 59, 999),
            },
          },
        ],
      })
      .countDocuments();
    return todayOrdersCount;
  }
}
