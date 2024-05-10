import AccessModule from "src/features/user/access/access.module";
import CityModule from "src/features/management/city/city.module";
import ComplexCategoryModule from "src/features/category/complex-category/complex-category.module";
import { ComplexActionsService } from "./service/complex-actions.service";
import { ComplexController } from "./controllers/complex.controller";
import { ComplexFetchService } from "./service/comlex-fetch.service";
import { ComplexSchema } from "./complex.schema";
import { Global, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import ProductModule from "src/features/product/product/product.module";
import { ComplexPutController } from "./controllers/complex-put.controller";
import { ComplexPutService } from "./service/complex-put.service";
import UserModule from "src/features/user/users/user.module";

const Complex = MongooseModule.forFeature([
  { name: "complex", schema: ComplexSchema },
]);

@Global()
@Module({
  imports: [
    Complex,
    AccessModule,
    ComplexCategoryModule,
    CityModule,
    ProductModule,
    UserModule,
  ],
  controllers: [ComplexController, ComplexPutController],
  providers: [ComplexActionsService, ComplexFetchService, ComplexPutService],
  exports: [ComplexActionsService, ComplexFetchService, ComplexPutService],
})
export default class ComplexModule {}
