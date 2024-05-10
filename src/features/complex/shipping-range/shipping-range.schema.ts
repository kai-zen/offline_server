import mongoose, { HydratedDocument } from 'mongoose';
import { ComplexDocument } from 'src/features/complex/complex/complex.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ versionKey: false })
export class ShippingRange {
  @Prop({ required: true, min: 0 })
  radius: number;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ default: false })
  is_active: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "complex" })
  complex: ComplexDocument;
}

export type ShippingRangeDocument = HydratedDocument<ShippingRange>;
export const ShippingRangeSchema = SchemaFactory.createForClass(ShippingRange);
