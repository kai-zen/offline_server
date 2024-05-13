import DiscountModule from "../discount/discount.module";
import { ProductService } from "./product.service";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ProductController } from "./product.controller";
import { ProductSchema } from "./product.schema";
import ProductFolderModule from "../folders/folder.module";

const Product = MongooseModule.forFeature([
  { name: "product", schema: ProductSchema },
]);

@Module({
  imports: [Product, DiscountModule, ProductFolderModule],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export default class ProductModule {}
