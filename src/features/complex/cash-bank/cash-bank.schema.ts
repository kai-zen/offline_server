import mongoose, { HydratedDocument } from "mongoose";
import { ComplexDocument } from "src/features/complex/complex/complex.schema";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { schemaConfig } from "src/helpers/constants";

@Schema(schemaConfig)
export class CashBank {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  last_print: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "complex" })
  complex: ComplexDocument;
}

export type CashBankDocument = HydratedDocument<CashBank>;
export const CashBankSchema = SchemaFactory.createForClass(CashBank);
