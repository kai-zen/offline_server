import mongoose, { HydratedDocument } from "mongoose";
import { ComplexDocument } from "src/features/complex/complex/complex.schema";
import { ProductDocument } from "src/features/product/product/product.schema";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { UserDocument } from "src/features/user/users/user.schema";
import { AccessDocument } from "src/features/user/access/access.schema";
import { CashBankDocument } from "src/features/complex/cash-bank/cash-bank.schema";

@Schema({ versionKey: false })
export class OrderAddress {
  @Prop()
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  latitude: number;

  @Prop()
  longitude: number;
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

  @Prop({ default: false, required: false })
  added_later: boolean;
}

@Schema({ versionKey: false })
export class Order {
  @Prop({ required: true, max: 50 })
  order_type: 1 | 2 | 3; // سایت - تلفنی - حضوری

  @Prop({ default: 1 })
  payment_type: 1 | 2 | 3 | 4 | 5 | 6; // pending - gateway - pos - cash - card - debt

  @Prop({ default: false })
  needs_pack: boolean;

  @Prop()
  description: string;

  @Prop()
  complex_description: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "user", default: null })
  user: UserDocument | null;

  @Prop({ type: OrderAddress, default: null })
  user_address: OrderAddress | null;

  @Prop()
  user_phone: string;

  @Prop([{ type: OrderProductItem, required: true }])
  products: OrderProductItem[];

  @Prop({ default: 0 })
  shipping_price: number;

  @Prop({ default: 0 })
  packing_price: number;

  @Prop({ required: true })
  total_price: number; // total price is not affected by discount

  @Prop({ default: 0 })
  extra_price: number;

  @Prop({ required: true })
  complex_discount: number;

  @Prop({ default: 0 })
  user_discount: number;

  @Prop()
  table_number: string;

  @Prop({ default: 1 })
  status: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  // ثبت - آماده‌سازی - ارسال|آماده تحویل - سرو - تحویل شد - رد - لغو

  @Prop()
  factor_number: number;

  @Prop()
  tax: number;

  @Prop()
  service: number;

  @Prop()
  created_at: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "access" })
  delivery_guy: AccessDocument;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "cash-bank" })
  cash_bank: CashBankDocument | null;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "complex" })
  complex: ComplexDocument;
}

export type OrderDocument = HydratedDocument<Order>;
export const OrderSchema = SchemaFactory.createForClass(Order);
