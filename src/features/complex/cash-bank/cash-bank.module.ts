import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CashBankSchema } from "./cash-bank.schema";
import { CashBankController } from "./cash-bank.controller";
import { CashBankService } from "./cash-bank.service";
import { HttpModule } from "@nestjs/axios";

const CashBank = MongooseModule.forFeature([
  { name: "cash-bank", schema: CashBankSchema },
]);

@Module({
  imports: [CashBank, HttpModule],
  controllers: [CashBankController],
  providers: [CashBankService],
  exports: [CashBankService],
})
export default class CashBankModule {}
