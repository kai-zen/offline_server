import { IsNotEmpty, IsString, IsNumber } from "class-validator";

export class EditPriceDto {
  @IsNumber()
  @IsNotEmpty()
  shipping_price: number;

  @IsNumber()
  @IsNotEmpty()
  packing_price: number;

  @IsNumber()
  @IsNotEmpty()
  extra_price: number;

  @IsNumber()
  @IsNotEmpty()
  user_discount: number;

  @IsString()
  @IsNotEmpty({
    message: "مجموعه تعیین نشده است.",
  })
  complex_id: string;
}
