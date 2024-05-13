import ProductModule from "src/features/product/product/product.module";
import UserModule from "src/features/user/users/user.module";
import { ComplexUserSchema } from "./complex-users.schema";
import { ComplexUsersController } from "./complex-user.controller";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ComplexUsersService } from "./complex-user.service";

const ComplexUser = MongooseModule.forFeature([
  { name: "complex-user", schema: ComplexUserSchema },
]);

@Module({
  imports: [ComplexUser, UserModule, ProductModule],
  controllers: [ComplexUsersController],
  providers: [ComplexUsersService],
  exports: [ComplexUsersService],
})
export default class ComplexUserModule {}
