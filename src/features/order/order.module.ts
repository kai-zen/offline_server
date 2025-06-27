import DiscountModule from "src/features/product/discount/discount.module";
import ProductModule from "src/features/product/product/product.module";
import UserModule from "src/features/user/users/user.module";
import { EventsModule } from "src/websocket/events.module";
import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { OrderSchema } from "./order.schema";
import AccessModule from "src/features/user/access/access.module";
import CashBankModule from "src/features/complex/cash-bank/cash-bank.module";
import ComplexUserAddressModule from "src/features/complex/user-address/user-address.module";
import { HttpModule } from "@nestjs/axios";
import { OrderGetController } from "./controller/get.controller";
import { OrderPostController } from "./controller/post.controller";
import { OrderPutController } from "./controller/put.conroller";
import { OrderFetchService } from "./service/R/fetch.service";
import { OrderStatsService } from "./service/R/stats.service";
import { OrderActionService } from "./service/U/actions.service";
import { OrderEditPaymentAndStatusService } from "./service/U/pay-and-status.service";
import { OrderEditItemsService } from "./service/U/items.service";
import { OrderCreateService } from "./service/C/by-emp.service";
import { OrderThirdMethodsService } from "./service/helpers.service";
import AreaModule from "../complex/area/area.module";
import ComplexModule from "../complex/complex/complex.module";
import { OrderOtherCreateService } from "./service/C/other.service";
import RangeModule from "../complex/range/range.module";
import PrinterModule from "../complex/printer/printer.module";

const Order = MongooseModule.forFeature([
  { name: "order", schema: OrderSchema },
]);

@Module({
  imports: [
    Order,
    ProductModule,
    RangeModule,
    UserModule,
    EventsModule,
    DiscountModule,
    AccessModule,
    ComplexUserAddressModule,
    ComplexModule,
    AreaModule,
    PrinterModule,
    forwardRef(() => CashBankModule),
    HttpModule,
  ],
  controllers: [OrderGetController, OrderPostController, OrderPutController],
  providers: [
    OrderFetchService,
    OrderStatsService,
    OrderActionService,
    OrderEditPaymentAndStatusService,
    OrderEditItemsService,
    OrderCreateService,
    OrderThirdMethodsService,
    OrderOtherCreateService,
  ],
  exports: [OrderActionService, OrderStatsService, OrderOtherCreateService],
})
export default class OrderModule {}
