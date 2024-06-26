import DiscountModule from "src/features/product/discount/discount.module";
import ProductModule from "src/features/product/product/product.module";
import ShippingRangeModule from "src/features/complex/shipping-range/shipping-range.module";
import UserModule from "src/features/user/users/user.module";
import { EventsModule } from "src/websocket/events.module";
import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { OrderActionService } from "./service/order-action.service";
import { OrderController } from "./order.controller";
import { OrderFetchService } from "./service/order-fetch.service";
import { OrderSchema } from "./order.schema";
import { OrderThirdMethodsService } from "./service/third-methods.actions";
import { OrderCreateService } from "./service/order-create.service";
import AccessModule from "src/features/user/access/access.module";
import CashBankModule from "src/features/complex/cash-bank/cash-bank.module";
import ComplexUserAddressModule from "src/features/complex/user-address/user-address.module";
import { OrderStatsService } from "./service/order-stats.service";
import { HttpModule } from "@nestjs/axios";

const Order = MongooseModule.forFeature([
  { name: "order", schema: OrderSchema },
]);

@Module({
  imports: [
    Order,
    ProductModule,
    ShippingRangeModule,
    UserModule,
    EventsModule,
    DiscountModule,
    AccessModule,
    ComplexUserAddressModule,
    forwardRef(() => CashBankModule),
    HttpModule,
  ],
  controllers: [OrderController],
  providers: [
    OrderActionService,
    OrderFetchService,
    OrderThirdMethodsService,
    OrderCreateService,
    OrderStatsService,
  ],
  exports: [
    OrderActionService,
    OrderFetchService,
    OrderCreateService,
    OrderStatsService,
  ],
})
export default class OrderModule {}
