import { Injectable } from "@nestjs/common";
import { Model } from "mongoose";
import { OrderDocument } from "../../order.schema";
import { InjectModel } from "@nestjs/mongoose";
import { lastValueFrom } from "rxjs";
import { Cron, CronExpression } from "@nestjs/schedule";
import { HttpService } from "@nestjs/axios";
import { sofreBaseUrl } from "src/helpers/constants";
import { ComplexService } from "src/features/complex/complex/comlex.service";
import { UserService } from "src/features/user/users/user.service";
import { PrinterService } from "src/features/complex/printer/printer.service";
import { ComplexUserAddressService } from "src/features/complex/user-address/user-address.service";

@Injectable()
export class OrderOtherCreateService {
  constructor(
    @InjectModel("order")
    private readonly model: Model<OrderDocument>,
    private readonly complexService: ComplexService,
    private readonly userService: UserService,
    private readonly complexUserAddressService: ComplexUserAddressService,
    private readonly printerService: PrinterService,
    private readonly httpService: HttpService
  ) {}

  async newOrders() {
    const theComplex = await this.complexService.findTheComplex();
    const lastCreatedAt = theComplex.last_orders_update
      ? new Date(theComplex.last_orders_update)
      : null;
    const filters = lastCreatedAt
      ? { created_at: { $gt: lastCreatedAt }, status: { $lt: 6 } }
      : { status: { $lt: 6 } };
    return await this.model.find(filters).exec();
  }

  async uploadOrders() {
    const newOrders = await this.newOrders();
    try {
      await lastValueFrom(
        this.httpService.post(
          `${sofreBaseUrl}/orders/offline`,
          {
            complex_id: process.env.COMPLEX_ID,
            orders: newOrders,
          },
          { headers: { "api-key": process.env.SECRET } }
        )
      );
      await this.complexService.updatedOrders();
      await this.printerService.uploadNeededs();
      await this.complexUserAddressService.uploadNeededs();
      await this.userService.uploadNeededs();
    } catch (err) {
      console.log(err.response.data);
      return err.response.data;
    }
    return "success";
  }

  @Cron(CronExpression.EVERY_2_HOURS, {
    name: "complex-activation-cron",
    timeZone: "Asia/Tehran",
  })
  async handleCron() {
    await this.uploadOrders();
  }
}
