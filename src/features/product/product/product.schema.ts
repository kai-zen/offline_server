import mongoose, { HydratedDocument } from "mongoose";
import { ComplexDocument } from "src/features/complex/complex/complex.schema";
import { ProductCategoryDocument } from "src/features/category/product-category/product-category.schema";
import { ProductFolderDocument } from "src/features/category/folders/folder.schema";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { TagDocument } from "src/features/management/tag/tag.schema";
import { schemaConfig } from "src/helpers/constants";

@Schema(schemaConfig)
class ProductPriceSchema {
  @Prop({ required: true })
  price: number;

  @Prop()
  title: string;
}

@Schema({ versionKey: false })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop([{ type: ProductPriceSchema }])
  prices: ProductPriceSchema[];

  @Prop({ default: 0 })
  packing: number;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "product-category",
  })
  category: ProductCategoryDocument;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: "product-folder",
  })
  folder: ProductFolderDocument;

  @Prop({ default: [] })
  images: string[];

  @Prop({ default: 0 })
  primary_image_index: number;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "complex",
    required: true,
  })
  complex: ComplexDocument;

  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: "tag" }])
  tags: TagDocument[];

  @Prop({ default: true })
  has_stock: boolean;

  @Prop({ default: true })
  is_active: boolean;

  @Prop({ default: false })
  has_shipping: boolean; // equals to unable to pack

  @Prop({ default: true })
  is_packable: boolean;

  @Prop({ default: 0 })
  total_sale: number;

  @Prop({ default: 0 })
  total_points: number;

  @Prop({ default: 0 })
  total_comments: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

export type ProductDocument = HydratedDocument<Product>;
