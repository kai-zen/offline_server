import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

@Schema({ versionKey: false })
export class Geometry {
  @Prop({ enum: ["Polygon"], required: true })
  type: string;

  @Prop({ type: [[[Number]]], required: true })
  coordinates: number[][][];
}

@Schema({ versionKey: false })
export class Region {
  @Prop({ type: Geometry, required: true, index: "2dsphere" })
  geometry: Geometry;
}

export type RegionDocument = HydratedDocument<Region>;
export const RegionSchema = SchemaFactory.createForClass(Region);
