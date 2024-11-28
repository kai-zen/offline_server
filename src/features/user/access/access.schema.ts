import mongoose, { HydratedDocument } from "mongoose";
import { ComplexDocument } from "src/features/complex/complex/complex.schema";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { UserDocument } from "../users/user.schema";

@Schema({ versionKey: false })
export class Access {
  @Prop({ required: true })
  type: number;

  @Prop({ default: "" })
  name: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "complex" })
  complex: ComplexDocument;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "user" })
  user: UserDocument;
}

export type AccessDocument = HydratedDocument<Access>;
export const AccessSchema = SchemaFactory.createForClass(Access);

// export const complexRoles = [
//   {
//     id: 1,
//     title: "مدیر مجموعه",
//   },
//   {
//     id: 2,
//     title: "دستیار مدیریت",
//   },
//   {
//     id: 3,
//     title: "حسابدار",
//   },
//   {
//     id: 4,
//     title: "صندوق‌دار",
//   },
//   {
//     id: 5,
//     title: "سرآشپز",
//   },
//   {
//     id: 6,
//     title: "آشپز",
//   },
//   {
//     id: 7,
//     title: "سالن دار",
//   },
//   {
//     id: 8,
//     title: "گارسون",
//   },
//   {
//     id: 9,
//     title: "پیک",
//   },
//   {
//     id: 10,
//     title: "ادمین محتوا",
//   },
//   {
//    id: 11,
//    title: "انباردار"
//   },
//   {
//    id: 12,
//    title: "پرسنل عادی"
//  }
// ];
