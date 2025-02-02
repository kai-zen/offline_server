import { Injectable, Scope } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { toObjectId } from "src/helpers/functions";
import { OrderDocument } from "../../order.schema";

@Injectable({ scope: Scope.REQUEST })
export class OrderStatsService {
  constructor(
    @InjectModel("order")
    private readonly model: Model<OrderDocument>
  ) {}

  async hasOpenOrders(cashbankId: string) {
    return await this.model.exists({
      cash_bank: toObjectId(cashbankId),
      status: { $nin: [1, 6, 7] },
      payments: { $size: 0 },
      on_hold: false,
    });
  }
}
