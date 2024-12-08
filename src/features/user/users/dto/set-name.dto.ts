import { IsNotEmpty, IsString } from "class-validator";

export class SetNameDto {
  @IsString()
  @IsNotEmpty({ message: "مجموعه تعیین نشده است." })
  complex_id: string;

  @IsString()
  @IsNotEmpty({ message: "نام مشتری تعیین نشده است." })
  name: string;

  @IsString()
  @IsNotEmpty({ message: "مشتری تعیین نشده است." })
  id: string;
}
