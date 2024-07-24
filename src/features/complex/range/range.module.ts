import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { HttpModule } from "@nestjs/axios";
import { RangeSchema } from "./range.schema";
import { RangeService } from "./range.service";
import { RangeController } from "./range.controller";
import RegionModule from "src/features/region/region.module";

const Range = MongooseModule.forFeature([
  { name: "range", schema: RangeSchema },
]);

@Module({
  imports: [Range, RegionModule, HttpModule],
  controllers: [RangeController],
  providers: [RangeService],
  exports: [RangeService],
})
export default class RangeModule {}
