import ShortUniqueId from "short-unique-id";
import { HydratedDocument, Document } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { schemaConfig } from "src/helpers/constants";

@Schema(schemaConfig)
export class User extends Document {
  @Prop({ default: "" })
  name: string;

  @Prop({ default: "" })
  bio: string;

  @Prop()
  birthday: Date;

  @Prop({
    sparse: true,
    unique: true,
    trim: true,
    lowercase: true,
  })
  email: string;

  @Prop({
    unique: true,
    default: function () {
      const uid = new ShortUniqueId({ length: 16 });
      return uid.rnd();
    },
  })
  username: string;

  @Prop({ required: true, unique: true, length: 11 })
  mobile: string;

  @Prop({ default: null })
  image: string | null;

  @Prop({ default: 1 })
  access_level: number;

  @Prop({ default: 0 })
  total_points: number;

  @Prop({ default: 0 })
  total_orders: number;

  @Prop()
  last_dto: Date;

  @Prop({ default: "" })
  auth_code: string;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
