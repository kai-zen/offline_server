import { IsNotEmpty, IsString, Length } from "class-validator";

export class SendCodeDto {
  @IsString()
  @IsNotEmpty({
    message: "وارد کردن شماره موبایل مدیر مجموعه الزامیست.",
  })
  @Length(11, 11, {
    message: "شماره موبایل باید یازده رقمی باشد.",
  })
  mobile: string;
}
