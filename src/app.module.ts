import AccessModule from "./features/user/access/access.module";
import ComplexModule from "./features/complex/complex/complex.module";
import DiscountModule from "./features/product/discount/discount.module";
import OrderModule from "./features/order/order.module";
import ProductModule from "./features/product/product/product.module";
import ShippingRangeModule from "./features/complex/shipping-range/shipping-range.module";
import UserModule from "./features/user/users/user.module";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { EventsModule } from "./websocket/events.module";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import CashBankModule from "./features/complex/cash-bank/cash-bank.module";
import ComplexUserAddressModule from "./features/complex/user-address/user-address.module";
import ProductFolderModule from "./features/product/folders/folder.module";
import { JwtModule, JwtService } from "@nestjs/jwt";
import PrinterModule from "./features/complex/printer/printer.module";
import AreaModule from "./features/complex/area/area.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    MongooseModule.forRoot(process.env.DB_CONNECTION_STRING),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    ScheduleModule.forRoot(),
    JwtModule.registerAsync({
      global: true,
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get("JWT_SECRET"),
      }),
      inject: [ConfigService],
    }),
    // features
    UserModule,
    ComplexModule,
    AccessModule,
    ShippingRangeModule,
    ProductModule,
    DiscountModule,
    OrderModule,
    ProductFolderModule,
    CashBankModule,
    ComplexUserAddressModule,
    PrinterModule,
    AreaModule,
    // websocket
    EventsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }, JwtService],
})
export class AppModule {}
