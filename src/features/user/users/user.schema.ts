import mongoose, { HydratedDocument, Document, Types } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { schemaConfig } from "src/helpers/constants";
import { ProductDocument } from "src/features/product/product/product.schema";
import { OrderDocument } from "src/features/order/order.schema";

@Schema({ versionKey: false })
class ComplexUserProduct {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "product",
  })
  product: ProductDocument;

  @Prop({ default: [] })
  rates: (1 | 2 | 3 | 4 | 5)[];

  @Prop({ default: 1 })
  iteration: number;
}

@Schema({ versionKey: false })
class ComplexUserOrder {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "order",
  })
  order: OrderDocument;

  @Prop({ default: 0 })
  total: number;
}

@Schema(schemaConfig)
export class User extends Document {
  @Prop({ required: true, length: 11, unique: true })
  mobile: string;

  @Prop({ default: null, type: Types.ObjectId })
  complex_user_id: Types.ObjectId | null;

  @Prop()
  name: string;

  @Prop([{ type: ComplexUserProduct }])
  products: ComplexUserProduct[];

  @Prop([{ type: ComplexUserOrder }])
  orders: ComplexUserOrder[];

  @Prop()
  birthday: Date;

  @Prop({ default: null })
  subscription_number: string;

  @Prop({ default: 0 })
  gender: 0 | 1 | 2;

  @Prop({ default: null, type: Date })
  last_visit: Date;

  @Prop()
  username: string;

  @Prop({ default: null })
  image: string | null;

  @Prop({ default: false })
  needs_upload: boolean;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
