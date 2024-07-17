import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { HttpModule } from "@nestjs/axios";
import { AreaController } from "./area.controller";
import { AreaService } from "./area.service";
import { AreaSchema } from "./area.schema";

const Area = MongooseModule.forFeature([{ name: "area", schema: AreaSchema }]);

@Module({
  imports: [Area, HttpModule],
  controllers: [AreaController],
  providers: [AreaService],
  exports: [AreaService],
})
export default class AreaModule {}
