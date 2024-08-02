import { HydratedDocument, Document } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { schemaConfig } from "src/helpers/constants";

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

  @Prop({ required: true, unique: true, length: 11 })
  mobile: string;

  @Prop({ default: null })
  image: string | null;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
