import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export class CreateProductFolderDto {
  @IsString()
  @MinLength(2, {
    message: "نام دسته بندی باید حداقل دو حرف باشد.",
  })
  @IsNotEmpty({ message: "وارد کردن نام دسته بندی الزامیست." })
  name: string;

  @IsNumber()
  @IsOptional()
  start_at: number;

  @IsNumber()
  @IsOptional()
  end_at: number;
}
