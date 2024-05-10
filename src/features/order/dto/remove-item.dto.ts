import { IsNotEmpty, IsString } from "class-validator";

export class RemoveItemFromOrderDto {
  @IsString()
  @IsNotEmpty()
  price_id: string;

  @IsString()
  @IsNotEmpty()
  product_id: string;

  @IsString()
  @IsNotEmpty({
    message: "مجموعه تعیین نشده است.",
  })
  complex_id: string;
}
