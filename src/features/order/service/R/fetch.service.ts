import {
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { toObjectId } from "src/helpers/functions";
import { messages } from "src/helpers/constants";
import { CashBankService } from "src/features/complex/cash-bank/cash-bank.service";
import { OrderDocument } from "../../order.schema";
import {
  complexOrdersFiltersHandler,
  productDataFormatter,
} from "../../helpers/functions";
import { ComplexService } from "src/features/complex/complex/comlex.service";
import { complexOrdersArchieveGroup } from "../../helpers/aggregate-constants";

@Injectable()
export class OrderFetchService {
  constructor(
    @InjectModel("order")
    private readonly model: Model<OrderDocument>,
    @Inject(forwardRef(() => CashBankService))
    private readonly cashbankService: CashBankService,
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
    const { limit, page = "1", ...otherParams } = queryParams || {};
    const applyingLimit = parseInt(limit) || 12;

    const filters = complexOrdersFiltersHandler(otherParams);

    const [queryResult] = await this.model.aggregate([
      { $match: { complex: toObjectId(complex_id) } },
      {
        $lookup: {
          from: "complex-users",
          foreignField: "_id",
          localField: "complex_user",
          as: "complex_user",
        },
      },
      { $unwind: "$complex_user" },
      {
        $lookup: {
          from: "users",
          foreignField: "_id",
          localField: "user",
          as: "user",
        },
      },
      { $unwind: "$user" },
      ...(filters.length ? [{ $match: { $and: filters } }] : []),
      {
        $lookup: {
          from: "users",
          foreignField: "_id",
          localField: "submitter",
          as: "submitter",
        },
      },
      { $unwind: { path: "$submitter", preserveNullAndEmptyArrays: true } },
      { $unwind: "$products" },
      {
        $lookup: {
          from: "products",
          localField: "products.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $group: complexOrdersArchieveGroup,
      },
      { $sort: { created_at: -1 } },
      {
        $facet: {
          results: [
            { $skip: (parseInt(page) - 1) * applyingLimit },
            { $limit: applyingLimit },
          ],
          totalDocuments: [{ $count: "count" }],
        },
      },
    ]);
    if (!queryResult) throw new NotFoundException(messages[404]);
    const { results, totalDocuments } = queryResult;
    const numberOfPages = Math.ceil(totalDocuments?.[0]?.count / applyingLimit);

    return { items: results, numberOfPages };
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
