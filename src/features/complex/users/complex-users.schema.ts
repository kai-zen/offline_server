import mongoose, { HydratedDocument } from "mongoose";
import { ComplexDocument } from "../complex/complex.schema";
import { ProductDocument } from "src/features/product/product/product.schema";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { UserDocument } from "src/features/user/users/user.schema";
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

@Schema({
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class ComplexUser {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "complex",
    required: true,
  })
  complex: ComplexDocument;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  })
  user: UserDocument;

  @Prop([{ type: ComplexUserProduct }])
  products: ComplexUserProduct[];

  @Prop([{ type: ComplexUserOrder }])
  orders: ComplexUserOrder[];

  @Prop({ default: 0 })
  given_discounts: number;

  @Prop({ default: 0 })
  used_discounts: number;

  @Prop([{ type: ComplexUserOrder }])
  debt: ComplexUserOrder[];

  @Prop({ default: null })
  last_given_discount: Date;

  @Prop()
  created_at: string | Date;

  @Prop()
  last_visit: Date;
}

export const ComplexUserSchema = SchemaFactory.createForClass(ComplexUser);
ComplexUserSchema.virtual("orders_stats").get(function () {
  let totalSpent = 0;
  this.orders.forEach((item) => (totalSpent += item.total));
  return { quantity: this.orders.length, total_spent: totalSpent };
});

ComplexUserSchema.virtual("favorite_product").get(function () {
  const favoriteProduct =
    this.products.sort((a, b) => b.iteration - a.iteration)?.[0] || null;
  return favoriteProduct;
});

export type ComplexUserDocument = HydratedDocument<ComplexUser>;
