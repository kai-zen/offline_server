import { ProductFolderSchema } from "./folder.schema";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ProductFolderController } from "./folder.controller";
import { ProductFolderService } from "./folder.service";
import { HttpModule } from "@nestjs/axios";

const ProductFolder = MongooseModule.forFeature([
  { name: "product-folder", schema: ProductFolderSchema },
]);

@Module({
  imports: [ProductFolder, HttpModule],
  controllers: [ProductFolderController],
  providers: [ProductFolderService],
  exports: [ProductFolderService],
})
export default class ProductFolderModule {}
