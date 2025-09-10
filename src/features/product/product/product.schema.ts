import { HydratedDocument, Types } from "mongoose";
import { ComplexDocument } from "src/features/complex/complex/complex.schema";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { schemaConfig } from "src/helpers/constants";
import { ProductFolderDocument } from "../folders/folder.schema";

@Schema({ versionKey: false })
class ProductPriceSchema {
  @Prop({ required: true })
  price: number;

  @Prop()
  title: string;
}

@Schema({ versionKey: false })
class ProductDependecySchema {
  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: "product",
  })
  product: ProductDocument | Types.ObjectId;

  @Prop({ required: true, default: 1 })
  amount: number;
}

@Schema(schemaConfig)
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop([{ type: ProductPriceSchema }])
  prices: ProductPriceSchema[];

  @Prop([{ type: ProductDependecySchema }])
  dependencies: ProductDependecySchema[];

  @Prop({ default: 0 })
  packing: number;

  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: "product-folder",
  })
  folder: ProductFolderDocument;

  @Prop({ default: [] })
  images: string[];

  @Prop({ default: 0 })
  primary_image_index: number;

  @Prop({
    type: Types.ObjectId,
    ref: "complex",
    required: true,
  })
  complex: ComplexDocument;

  @Prop({ default: false })
  is_deleted: boolean;

  @Prop({ default: false })
  has_shipping: boolean; // equals to unable to pack

  @Prop({ default: true })
  is_packable: boolean;

  @Prop({ default: false })
  is_archived: boolean;

  @Prop({ default: false })
  has_warehousing_relation: boolean;

  @Prop({ type: [Number], default: null })
  days_limit: number[] | null;

  @Prop({ default: 1 })
  row: number;

  @Prop({ default: null })
  cost: number | null;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

export type ProductDocument = HydratedDocument<Product>;
