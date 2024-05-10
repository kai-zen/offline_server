import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { ComplexDocument } from "src/features/complex/complex/complex.schema";

@Schema({ versionKey: false })
export class ProductFolder {
  @Prop({ required: true })
  name: string;

  @Prop({ default: null })
  start_at: number | null;

  @Prop({ default: null })
  end_at: number | null;

  @Prop({ default: 1 })
  row: number;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "user", required: true })
  complex: ComplexDocument;
}

export type ProductFolderDocument = HydratedDocument<ProductFolder>;
export const ProductFolderSchema = SchemaFactory.createForClass(ProductFolder);
