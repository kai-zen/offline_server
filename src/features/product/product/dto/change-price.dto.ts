import { IsArray, IsNotEmpty, IsNumber, Max, Min } from "class-validator";

export class ChangePriceDto {
  @IsNumber()
  @IsNotEmpty({
    message: "وارد کردن درصد تغییر قیمت الزامیست.",
  })
  @Min(-90, { message: "درصد وارد شده باید از منفی 90 بزرگتر باشد." })
  @Max(400, { message: "درصد وارد شده باید از 400 کوچکتر باشد." })
  percent: number;

  @IsNumber()
  rounder: number;

  @IsArray()
  products: string[];
}
