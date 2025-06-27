import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

export class SetNameDto {
  @IsString()
  @IsNotEmpty({ message: "مجموعه تعیین نشده است." })
  complex_id: string;

  @IsString()
  @IsOptional()
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

  @IsBoolean()
  @IsNotEmpty({ message: "وضعیت بارگزاری مشخص نشده است" })
  needs_upload: boolean;
}
