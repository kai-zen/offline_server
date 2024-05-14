import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ShippingRangeController } from "./shipping-range.controller";
import { ShippingRangeSchema } from "./shipping-range.schema";
import { ShippingRangeService } from "./shipping-range.service";
import { HttpModule } from "@nestjs/axios";

const ShippingRange = MongooseModule.forFeature([
  { name: "shipping-range", schema: ShippingRangeSchema },
]);

@Module({
  imports: [ShippingRange, HttpModule],
  controllers: [ShippingRangeController],
  providers: [ShippingRangeService],
  exports: [ShippingRangeService],
})
export default class ShippingRangeModule {}
