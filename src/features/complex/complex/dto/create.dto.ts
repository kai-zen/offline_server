import { IsNotEmpty, IsString, Length } from "class-validator";

export class CreateComplexDto {
  @IsString()
  @IsNotEmpty({
    message: "وارد کردن نام مجموعه الزامیست.",
  })
  name: string;

  @IsString()
  @IsNotEmpty({ message: "وارد کردن دسته بندی محصول الزامیست" })
  category: string;

  @IsString()
  @IsNotEmpty({
    message: "وارد کردن توضیحات مجموعه الزامیست.",
  })
  @Length(10, 350, {
    message: "توضیحات مجموعه باید بین ده تا سیصد و پنجاه حرف باشد.",
  })
  description: string;
}
