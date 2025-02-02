import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { OrderDocument } from "../../order.schema";
import { productDataFormatter } from "../../helpers/functions";
import { ComplexService } from "src/features/complex/complex/comlex.service";

@Injectable()
export class OrderFetchService {
  constructor(
    @InjectModel("order")
    private readonly model: Model<OrderDocument>,
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
}
