import DiscountModule from "../discount/discount.module";
import ProductActionsService from "./service/product-actions.service";
import ProductCategoryModule from "src/features/category/product-category/product-category.module";
import ProductFetchService from "./service/product-fetch.service";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ProductController } from "./product.controller";
import { ProductSchema } from "./product.schema";
import ProductFolderModule from "src/features/category/folders/folder.module";

const Product = MongooseModule.forFeature([
  { name: "product", schema: ProductSchema },
]);

@Module({
  imports: [
    Product,
    ProductCategoryModule,
    DiscountModule,
    ProductFolderModule,
  ],
  controllers: [ProductController],
  providers: [ProductActionsService, ProductFetchService],
  exports: [ProductActionsService, ProductFetchService],
})
export default class ProductModule {}
