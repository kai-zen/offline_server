import mongoose, { HydratedDocument, Types } from "mongoose";
import { ComplexDocument } from "src/features/complex/complex/complex.schema";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { RegionDocument } from "src/features/region/region.schema";

@Schema({ versionKey: false })
export class Range {
  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: "region" }])
  regions: (RegionDocument | Types.ObjectId)[];

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ default: false })
  is_active: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "complex" })
  complex: ComplexDocument | Types.ObjectId;
}

export type RangeDocument = HydratedDocument<Range>;
export const RangeSchema = SchemaFactory.createForClass(Range);
