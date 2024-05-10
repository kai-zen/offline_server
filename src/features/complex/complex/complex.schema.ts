import mongoose, { HydratedDocument } from "mongoose";
import ShortUniqueId from "short-unique-id";
import { CityDocument } from "src/features/management/city/city.schema";
import { ComplexCategoryDocument } from "src/features/category/complex-category/complex-category.schema";
import { ProductDocument } from "src/features/product/product/product.schema";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { TagDocument } from "src/features/management/tag/tag.schema";
import { UserDocument } from "src/features/user/users/user.schema";
import { schemaConfig } from "src/helpers/constants";

@Schema({ versionKey: false })
export class PointSchema {
  @Prop({ enum: ["Point"], required: true })
  type: string;

  @Prop({ type: [Number], required: true })
  coordinates: [number, number];
}

@Schema({ versionKey: false })
export class ComplexAddress {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, min: 10, max: 250 })
  description: string;

  @Prop()
  phone: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "city" })
  city: CityDocument;

  @Prop({ type: PointSchema, required: true, index: "2dsphere" })
  location: { type: "Point"; coordinates: [number, number] };
}

@Schema({ versionKey: false })
class GatewaySchema {
  @Prop({ default: 1 })
  type: number;

  @Prop({ required: true })
  gate_id: string;
}

@Schema({ versionKey: false })
class EnamadSchema {
  @Prop({ required: true })
  namad_id: string;

  @Prop({ required: true })
  namad_code: string;
}

@Schema(schemaConfig)
export class Complex {
  @Prop({ required: true, max: 50 })
  name: string;

  @Prop({ required: true, min: 10, max: 250 })
  description: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "complex-category" })
  category: ComplexCategoryDocument;

  @Prop()
  image: string;

  @Prop({ default: 1 })
  access_level: 1 | 2 | 3 | 4 | 5;

  @Prop()
  expiration_date: Date;

  @Prop({ default: 0 })
  min_online_ordering_price: number;

  @Prop({ default: 0 })
  packing: number;

  @Prop({
    unique: true,
    default: function () {
      const uid = new ShortUniqueId({ length: 12 });
      return uid.rnd();
    },
  })
  username: string;

  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: "product" }])
  promoted_products: ProductDocument[];

  @Prop({ default: 0 })
  max_range: number;

  @Prop({ default: 0 })
  balance: number;

  @Prop({ type: ComplexAddress, default: null })
  address: ComplexAddress | null;

  @Prop({ default: 0 })
  total_points: number;

  @Prop({ default: 0 })
  total_comments: number;

  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: "tag", default: [] }])
  tags: TagDocument[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "user" })
  owner: UserDocument;

  // other settings
  @Prop({ type: GatewaySchema, default: null })
  gateway: {
    type: number;
    gate_id: string;
  };

  @Prop({ type: EnamadSchema, default: null })
  enamad: {
    namad_id: string;
    namad_code: string;
  };

  @Prop({ default: "#000" })
  color: string;

  @Prop()
  domain: string;

  @Prop({ default: 0 })
  sms_budget: number;

  @Prop({ default: 0 })
  service: number;

  @Prop({ default: 0 })
  tax: number;

  // settings
  @Prop({ default: false })
  is_active: boolean;

  @Prop({ default: false })
  is_website: boolean;

  @Prop({ default: false })
  has_reserve: boolean;

  @Prop({ default: true })
  auto_copy_addresses: boolean;

  @Prop({ default: false })
  has_sale: boolean;
}

export type ComplexDocument = HydratedDocument<Complex>;
export const ComplexSchema = SchemaFactory.createForClass(Complex);
