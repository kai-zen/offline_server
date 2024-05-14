import { ComplexController } from "./complex.controller";
import { ComplexService } from "./comlex.service";
import { ComplexSchema } from "./complex.schema";
import { Global, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { HttpModule } from "@nestjs/axios";

const Complex = MongooseModule.forFeature([
  { name: "complex", schema: ComplexSchema },
]);

@Global()
@Module({
  imports: [Complex, HttpModule],
  controllers: [ComplexController],
  providers: [ComplexService],
  exports: [ComplexService],
})
export default class ComplexModule {}
