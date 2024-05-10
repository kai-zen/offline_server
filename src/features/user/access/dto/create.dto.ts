import { IsNotEmpty, IsNumber, IsString, Length } from "class-validator";

export class CreateAccessDto {
  @IsString()
  @IsNotEmpty({
    message: "وارد کردن شماره موبایل الزامیست.",
  })
  @Length(11, 11, {
    message: "شماره موبایل باید یازده رقمی باشد.",
  })
  mobile: string;

  @IsNumber()
  @IsNotEmpty({ message: "سطح دسترسی مورد نظر خود را وارد کنید" })
  type: number;
}
