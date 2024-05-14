import { HttpModule } from "@nestjs/axios";
import { AccessController } from "./access.controller";
import { AccessSchema } from "./access.schema";
import { AccessService } from "./access.service";
import { Global, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

const Access = MongooseModule.forFeature([
  { name: "access", schema: AccessSchema },
]);

@Global()
@Module({
  imports: [Access, HttpModule],
  controllers: [AccessController],
  providers: [AccessService],
  exports: [AccessService],
})
export default class AccessModule {}
