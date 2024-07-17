import mongoose, { HydratedDocument } from "mongoose";
import { ComplexDocument } from "src/features/complex/complex/complex.schema";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ versionKey: false })
export class Area {
  @Prop({ required: true })
  name: string;

  @Prop({ default: [] })
  tables: number[];

  @Prop()
  capacity: number;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "complex" })
  complex: ComplexDocument;
}

export type AreaDocument = HydratedDocument<Area>;
export const AreaSchema = SchemaFactory.createForClass(Area);
