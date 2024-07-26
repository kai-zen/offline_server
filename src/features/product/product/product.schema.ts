import mongoose, { HydratedDocument } from "mongoose";
import { ComplexDocument } from "src/features/complex/complex/complex.schema";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { schemaConfig } from "src/helpers/constants";
import { ProductFolderDocument } from "../folders/folder.schema";

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

  @Prop({ default: false })
  has_shipping: boolean; // equals to unable to pack

  @Prop({ default: true })
  is_packable: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

export type ProductDocument = HydratedDocument<Product>;
