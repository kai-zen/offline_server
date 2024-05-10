import { IsBoolean, IsNotEmpty, IsNumber } from "class-validator";

export class CreateRangeDto {
  @IsNumber()
  @IsNotEmpty({
    message: "وارد کردن شعاع ارسال الزامیست.",
  })
  radius: number;

  @IsNumber()
  @IsNotEmpty({
    message: "وارد کردن هزینه ارسال الزامیست.",
  })
  price: number;

  @IsBoolean()
  is_active: boolean;
}
