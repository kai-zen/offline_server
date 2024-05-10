import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsBoolean,
} from "class-validator";

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({
    message: "وارد کردن نام محصول الزامیست.",
  })
  name: string;

  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  category_id: string;

  @IsString()
  @IsNotEmpty({ message: "وارد کردن پوشه محصول الزامیست" })
  folder_id: string;

  @IsArray()
  @IsNotEmpty({ message: "وارد کردن قیمت محصول الزامیست" })
  prices: { title: string; price: number }[];

  @IsNumber()
  packing: number;

  @IsBoolean()
  has_shipping: boolean;

  @IsBoolean()
  is_packable: boolean;

  @IsString()
  @IsNotEmpty({ message: "وارد کردن آیدی مجموعه الزامیست" })
  complex_id: string;
}
