import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CashBankSchema } from "./cash-bank.schema";
import { CashBankController } from "./cash-bank.controller";
import { CashBankService } from "./cash-bank.service";
import { HttpModule } from "@nestjs/axios";
import OrderModule from "src/features/order/order.module";

const CashBank = MongooseModule.forFeature([
  { name: "cash-bank", schema: CashBankSchema },
]);

@Module({
  imports: [CashBank, HttpModule, forwardRef(() => OrderModule)],
  controllers: [CashBankController],
  providers: [CashBankService],
  exports: [CashBankService],
})
export default class CashBankModule {}
