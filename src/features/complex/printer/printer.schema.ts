import mongoose, { HydratedDocument } from "mongoose";
import { ComplexDocument } from "src/features/complex/complex/complex.schema";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { schemaConfig } from "src/helpers/constants";
import { AreaDocument } from "../area/area.schema";
import { ProductFolderDocument } from "src/features/product/folders/folder.schema";

export interface PrinterSettingsDataType {
  show_logo: boolean;
  show_site_qr: boolean;
  show_user_address: boolean;
  show_complex_address: boolean;
  show_complex_phone: boolean;
  show_complex_site: boolean;
  show_shipping_type: boolean;
}

@Schema({ versionKey: false })
class SettingsOptions {
  @Prop({ default: false })
  show_logo: boolean;

  @Prop({ default: true })
  show_site_qr: boolean;

  @Prop({ default: false })
  show_user_address: boolean;

  @Prop({ default: false })
  show_complex_address: boolean;

  @Prop({ default: false })
  show_complex_phone: boolean;

  @Prop({ default: false })
  show_complex_site: boolean;

  @Prop({ default: false })
  show_shipping_type: boolean;
}

@Schema(schemaConfig)
export class Printer {
  @Prop({ required: true })
  name: string;

  @Prop()
  title: string;

  @Prop({ required: true })
  paper_width: string;

  @Prop({ type: String, default: null })
  custom_margin: string;

  @Prop({ type: SettingsOptions, default: null })
  settings_options: SettingsOptions | null;

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
