import mongoose, { HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { UserDocument } from "src/features/user/users/user.schema";
import { schemaConfig } from "src/helpers/constants";
import { ComplexDocument } from "../complex/complex.schema";
import { CashBankDocument } from "../cash-bank/cash-bank.schema";

@Schema(schemaConfig)
export class Shift {
  @Prop({ required: true })
  start: Date;

  @Prop({ required: true })
  end: Date;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "complex",
    required: true,
  })
  complex: ComplexDocument;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "cash-bank",
    required: true,
  })
  cashbank: CashBankDocument;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "user" })
  cashier: UserDocument;

  @Prop({ required: true })
  total_income: number;

  @Prop()
  details: { _id: number; quantity: number; amount: number }[];

  @Prop({ required: true })
  total_orders: number;
}

export type ShiftDocument = HydratedDocument<Shift>;
export const ShiftSchema = SchemaFactory.createForClass(Shift);
