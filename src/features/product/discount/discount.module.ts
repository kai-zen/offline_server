import { DiscountController } from "./discount.controller";
import { DiscountSchema } from "./discount.schema";
import { DiscountService } from "./discount.service";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

const Discount = MongooseModule.forFeature([
  { name: "discount", schema: DiscountSchema },
]);

@Module({
  imports: [Discount],
  controllers: [DiscountController],
  providers: [DiscountService],
  exports: [DiscountService],
})
export default class DiscountModule {}
