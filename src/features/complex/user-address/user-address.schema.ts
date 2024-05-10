import mongoose, { HydratedDocument } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { UserDocument } from "src/features/user/users/user.schema";
import { ComplexDocument } from "../complex/complex.schema";

@Schema({ versionKey: false })
export class ComplexUserAddress {
  @Prop()
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  details: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "complex",
    required: true,
  })
  complex: ComplexDocument;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "user", required: true })
  user: UserDocument;

  @Prop({ required: true })
  latitude: number;

  @Prop({ required: true })
  longitude: number;
}

export type ComplexUserAddressDocument = HydratedDocument<ComplexUserAddress>;
export const ComplexUserAddressSchema =
  SchemaFactory.createForClass(ComplexUserAddress);
