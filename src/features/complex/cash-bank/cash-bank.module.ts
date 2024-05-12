import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CashBankSchema } from "./cash-bank.schema";
import { CashBankController } from "./cash-bank.controller";
import { CashBankService } from "./cash-bank.service";

const CashBank = MongooseModule.forFeature([
  { name: "cash-bank", schema: CashBankSchema },
]);

@Module({
  imports: [CashBank],
  controllers: [CashBankController],
  providers: [CashBankService],
  exports: [CashBankService],
})
export default class CashBankModule {}
