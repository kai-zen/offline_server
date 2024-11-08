import mongoose, { HydratedDocument } from "mongoose";
import { ComplexDocument } from "src/features/complex/complex/complex.schema";
import { ProductDocument } from "src/features/product/product/product.schema";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { UserDocument } from "src/features/user/users/user.schema";
import { AccessDocument } from "src/features/user/access/access.schema";
import { CashBankDocument } from "src/features/complex/cash-bank/cash-bank.schema";
import { AreaDocument } from "src/features/complex/area/area.schema";
import { ComplexUserAddressDocument } from "src/features/complex/user-address/user-address.schema";

@Schema({ versionKey: false })
export class OrderAddress {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "complex-user-address",
    default: null,
  })
  address_id?: ComplexUserAddressDocument;

  @Prop()
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  details: string;

  @Prop()
  latitude: number;

  @Prop()
  longitude: number;

  @Prop()
  phone_number: string;
}

@Schema({ versionKey: false })
export class OrderProductPrice {
  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  price_id: string;

  @Prop({ default: "" })
  title: string;
}

@Schema({ versionKey: false })
export class OrderProductItem {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "product",
    required: true,
  })
  product: ProductDocument;

  @Prop({ required: true })
  price: OrderProductPrice;

  @Prop({ default: 1, min: 1 })
  quantity: number;

  @Prop()
  diff?: number;
}

@Schema({ versionKey: false })
export class Order {
  @Prop({ required: true, max: 50 })
  order_type: 1 | 2 | 3; // سایت - تلفنی - حضوری

  @Prop({ default: 1 })
  payment_type: 1 | 2 | 3 | 4 | 5 | 6 | 7; // pending - gateway - pos - cash - card - debt - other

  @Prop({ default: "" })
  description: string;

  @Prop({ default: "" })
  complex_description: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "user", default: null })
  user: UserDocument | null;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "user", default: null })
  submitter: UserDocument | null;

  @Prop({ type: OrderAddress, default: null })
  user_address: OrderAddress | null;

  @Prop({ default: "" })
  user_phone: string;

  @Prop({ default: "" })
  navigation_link: string;

  @Prop([{ type: OrderProductItem, required: true }])
  products: OrderProductItem[];

  @Prop({ default: 0 })
  shipping_price: number;

  @Prop({ default: 0 })
  packing_price: number;

  @Prop({ required: true })
  total_price: number; // total price is affected by discount

  @Prop({ default: 0 })
  extra_price: number;

  @Prop({ required: true })
  complex_discount: number;

  @Prop({ default: 0 })
  user_discount: number;

  @Prop({ default: 0 })
  user_cashback: number;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "area", default: null })
  area: AreaDocument | null;

  @Prop({ default: null })
  table_number: number | null;

  @Prop({ default: 1 })
  status: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  // ثبت - آماده‌سازی - ارسال|آماده تحویل - سرو - تحویل شد - رد - لغو

  @Prop({ required: true })
  factor_number: number;

  @Prop({ default: 0 })
  tax: number;

  @Prop({ default: 0 })
  tip: number;

  @Prop({ default: 0 })
  service: number;

  @Prop({ required: true, immutable: true })
  created_at: Date;

  @Prop({ default: null })
  payed_at: Date | null;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "access",
    default: null,
  })
  delivery_guy: AccessDocument;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "cash-bank",
    default: null,
  })
  cash_bank: CashBankDocument | null;

  @Prop({ default: false })
  on_hold: boolean;

  @Prop({ default: true })
  submitted_offline: boolean;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "complex",
    required: true,
  })
  complex: ComplexDocument;
}

export type OrderDocument = HydratedDocument<Order>;
export const OrderSchema = SchemaFactory.createForClass(Order);
