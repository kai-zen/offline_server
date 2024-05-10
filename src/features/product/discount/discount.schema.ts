import mongoose, { HydratedDocument } from "mongoose";
import { ComplexDocument } from "src/features/complex/complex/complex.schema";
import { ProductDocument } from "../product/product.schema";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ProductFolderDocument } from "src/features/category/folders/folder.schema";

@Schema({ versionKey: false })
export class Discount {
  @Prop({ required: true, min: 0, max: 100 })
  percent: number;

  @Prop()
  start_date: Date;

  @Prop()
  expiration_date: Date;

  @Prop({ required: true })
  type: 1 | 2 | 3; // 1.all 2.category 3.product

  @Prop({ default: true })
  is_active: boolean;

  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: "product" }])
  products: ProductDocument[];

  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: "product-folder" }])
  folders: ProductFolderDocument[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "complex" })
  complex: ComplexDocument;
}

export type DiscountDocument = HydratedDocument<Discount>;
export const DiscountSchema = SchemaFactory.createForClass(Discount);
