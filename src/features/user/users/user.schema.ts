import mongoose, { HydratedDocument, Document } from "mongoose";
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
  @Prop({ default: "" })
  name: string;

  @Prop()
  birthday: Date;

  @Prop({
    trim: true,
    lowercase: true,
  })
  email: string;

  @Prop()
  username: string;

  @Prop({ required: true, length: 11 })
  mobile: string;

  @Prop({ default: null })
  image: string | null;

  @Prop({ default: null })
  subscription_number: string;

  @Prop([{ type: ComplexUserProduct }])
  products: ComplexUserProduct[];

  @Prop([{ type: ComplexUserOrder }])
  orders: ComplexUserOrder[];

  @Prop({ default: 0 })
  gender: 0 | 1 | 2;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
