import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import ShippingRangeModule from "src/features/complex/shipping-range/shipping-range.module";
import { ComplexUserAddressController } from "./user-address.controller";
import { ComplexUserAddressSchema } from "./user-address.schema";
import UserModule from "src/features/user/users/user.module";
import { ComplexUserAddressService } from "./user-address.service";
import { HttpModule } from "@nestjs/axios";

const ComplexUserAddress = MongooseModule.forFeature([
  { name: "complex-user-address", schema: ComplexUserAddressSchema },
]);

@Module({
  imports: [ComplexUserAddress, UserModule, ShippingRangeModule, HttpModule],
  controllers: [ComplexUserAddressController],
  providers: [ComplexUserAddressService],
  exports: [ComplexUserAddressService],
})
export default class ComplexUserAddressModule {}
