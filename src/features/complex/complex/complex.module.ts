import AccessModule from "src/features/user/access/access.module";
import { ComplexController } from "./complex.controller";
import { ComplexService } from "./comlex.service";
import { ComplexSchema } from "./complex.schema";
import { Global, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import ProductModule from "src/features/product/product/product.module";
import UserModule from "src/features/user/users/user.module";

const Complex = MongooseModule.forFeature([
  { name: "complex", schema: ComplexSchema },
]);

@Global()
@Module({
  imports: [Complex, AccessModule, ProductModule, UserModule],
  controllers: [ComplexController],
  providers: [ComplexService],
  exports: [ComplexService],
})
export default class ComplexModule {}
