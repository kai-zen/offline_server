import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class SetNameDto {
  @IsString()
  @IsNotEmpty({ message: "مجموعه تعیین نشده است." })
  complex_id: string;

  @IsString()
  @IsNotEmpty({ message: "نام مشتری تعیین نشده است." })
  name: string;

  @IsNumber()
  @IsOptional()
  gender: 0 | 1 | 2;

  @IsString()
  @IsOptional()
  birthday: string | null;

  @IsString()
  @IsNotEmpty({ message: "مشتری تعیین نشده است." })
  id: string;
}
