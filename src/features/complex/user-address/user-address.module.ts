import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { ComplexUserAddressController } from "./user-address.controller";
import { ComplexUserAddressSchema } from "./user-address.schema";
import UserModule from "src/features/user/users/user.module";
import { ComplexUserAddressService } from "./user-address.service";
import { HttpModule } from "@nestjs/axios";
import RangeModule from "../range/range.module";

const ComplexUserAddress = MongooseModule.forFeature([
  { name: "complex-user-address", schema: ComplexUserAddressSchema },
]);

@Module({
  imports: [ComplexUserAddress, UserModule, RangeModule, HttpModule],
  controllers: [ComplexUserAddressController],
  providers: [ComplexUserAddressService],
  exports: [ComplexUserAddressService],
})
export default class ComplexUserAddressModule {}
