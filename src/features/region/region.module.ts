import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { RegionSchema } from "./region.schema";
import { RegionController } from "./region.controller";
import { RegionService } from "./region.service";
import { HttpModule } from "@nestjs/axios";

const Region = MongooseModule.forFeature([
  { name: "region", schema: RegionSchema },
]);

@Module({
  imports: [Region, HttpModule],
  controllers: [RegionController],
  providers: [RegionService],
  exports: [RegionService],
})
export default class RegionModule {}
