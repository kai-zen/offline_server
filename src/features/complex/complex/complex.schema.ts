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

@Schema({ versionKey: false })
class CashbackSchema {
  @Prop({ required: true, min: 0, max: 50 })
  percent: number;

  @Prop({ default: null })
  limit: number;
}

@Schema({ versionKey: false })
class Settings {
  @Prop({ default: false })
  has_reserve: boolean;

  @Prop({ default: true })
  auto_copy_addresses: boolean;

  @Prop({ default: false })
  has_sale: boolean;

  @Prop({ default: false })
  has_shipping: boolean;

  @Prop({ default: false })
  has_place: boolean;

  @Prop({ default: false })
  has_indoor_payment: boolean;

  @Prop({ default: false })
  required_delivery_guy: boolean;

  @Prop({ default: false })
  typable_table_number: boolean;

  @Prop({ default: false })
  visible_order_status: boolean;

  @Prop({ default: false })
  callable_waiters: boolean;
}

@Schema(schemaConfig)
export class Complex {
  @Prop({ required: true, max: 50 })
  name: string;

  @Prop({ required: true, min: 10, max: 250 })
  description: string;

  @Prop()
  image: string;

  @Prop({
    default: "free",
    enum: [
      "free",
      "wp", // 4 (Warehouse + Presence)
      "wps1", // 6 (Warehouse + Presence + Site)
      "wps12", // 7
      "wps13", // 7
      "wps", // 9
      "a1", // 9 (Automation)
      "a12", // 11
      "a13", // 11
      "a", // 13
    ],
  })
  active_plan: string;

  @Prop()
  expiration_date: Date;

  @Prop({ default: 0 })
  min_online_ordering_price: number;

  @Prop({ default: 0 })
  packing: number;

  @Prop()
  username: string;

  @Prop({ default: 0 })
  max_range: number;

  @Prop({ type: ComplexAddress, default: null })
  address: ComplexAddress | null;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "user" })
  owner: UserDocument;

  @Prop({ default: "#000" })
  color: string;

  @Prop()
  domain: string;

  @Prop({ default: 0 })
  service: number;

  @Prop({ type: CashbackSchema, default: null })
  cashback: {
    percent: number;
    limit: number;
  } | null;

  @Prop({ default: null, min: 5, max: 95 })
  discount_limit: number;

  @Prop({ default: 0 })
  tax: number;

  @Prop({ default: "" })
  google_site_verification: string;

  // settings
  @Prop({ default: false })
  is_active: boolean;

  @Prop({ type: Settings, default: null })
  settings: Settings;

  @Prop({ default: [] })
  delivery_time:
    | []
    | [
        {
          start: number;
          end: number;
        },
      ]
    | [
        {
          start: number;
          end: number;
        },
        {
          start: number;
          end: number;
        },
      ];

  @Prop()
  api_key: string;

  @Prop({ default: null })
  last_addresses_update: Date;

  @Prop({ default: null })
  last_users_update: Date;

  @Prop({ default: null })
  last_orders_update: Date;
}

export type ComplexDocument = HydratedDocument<Complex>;
export const ComplexSchema = SchemaFactory.createForClass(Complex);
