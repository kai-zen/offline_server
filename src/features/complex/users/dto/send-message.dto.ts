import { IsArray, IsNotEmpty, IsString } from "class-validator";

export class SendMessageDto {
  @IsArray()
  @IsNotEmpty()
  users: { _id: string; message: string }[];
  // آیدی متعلق به کاربر مجموعه است

  @IsString()
  @IsNotEmpty({ message: "متن پیام تعیین نشده است." })
  message: string;
}
