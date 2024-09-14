import mongoose, { HydratedDocument } from "mongoose";
import { ComplexDocument } from "src/features/complex/complex/complex.schema";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { schemaConfig } from "src/helpers/constants";
import { AreaDocument } from "../area/area.schema";
import { ProductFolderDocument } from "src/features/product/folders/folder.schema";

@Schema(schemaConfig)
export class Printer {
  @Prop({ required: true })
  name: string;

  @Prop()
  title: string;

  @Prop({ required: true })
  paper_width: string;

  @Prop({ required: true })
  factor_type: number;

  @Prop([
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product-folder",
      default: null,
    },
  ])
  folders: ProductFolderDocument[];

  @Prop([
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "area",
      default: null,
    },
  ])
  areas: AreaDocument[];

  @Prop({ default: [1, 2, 3] })
  types: number[];

  @Prop({ default: false })
  is_common: boolean;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "complex",
    required: true,
  })
  complex: ComplexDocument;
}

export type PrinterDocument = HydratedDocument<Printer>;
export const PrinterSchema = SchemaFactory.createForClass(Printer);
