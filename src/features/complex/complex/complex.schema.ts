import mongoose, { HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
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

  @Prop({ type: PointSchema, required: true, index: "2dsphere" })
  location: { type: "Point"; coordinates: [number, number] };
}

@Schema(schemaConfig)
export class Complex {
  @Prop({ required: true, max: 50 })
  name: string;

  @Prop({ required: true, min: 10, max: 250 })
  description: string;

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

  @Prop({ default: "" })
  username: string;

  @Prop({ default: 0 })
  max_range: number;

  @Prop({ type: ComplexAddress, default: null })
  address: ComplexAddress | null;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "user" })
  owner: UserDocument;

  @Prop({ default: "#000" })
  color: string;

  @Prop({ default: 0 })
  service: number;

  @Prop({ default: 0 })
  tax: number;
}

export type ComplexDocument = HydratedDocument<Complex>;
export const ComplexSchema = SchemaFactory.createForClass(Complex);
