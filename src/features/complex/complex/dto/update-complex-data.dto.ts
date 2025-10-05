import { IsNotEmpty, IsString } from "class-validator";

export class UpdateComplexDataDto {
  @IsString()
  @IsNotEmpty({ message: "شناسه مجموعه تعیین نشده است." })
  complex_id: string;

  @IsString()
  @IsNotEmpty({ message: "توکن احراز هویت تعیین نشده است." })
  token: string;
}
