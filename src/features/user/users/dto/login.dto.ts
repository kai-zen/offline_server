import { IsNotEmpty, Length, IsString } from "class-validator";

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({
    message: "وارد کردن شماره موبایل الزامیست.",
  })
  @Length(11, 11, {
    message: "شماره موبایل باید یازده رقمی باشد.",
  })
  mobile: string;

  @IsString()
  @IsNotEmpty({
    message: "وارد کردن کد ورود الزامیست.",
  })
  @Length(5, 5, {
    message: "کد ورود باید پنج رقمی باشد.",
  })
  code: string;
}
