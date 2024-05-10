import { IsNotEmpty, IsString } from "class-validator";

export class UpdateEnamadDto {
  @IsString()
  @IsNotEmpty({
    message: "وارد کردن آیدی اینماد الزامیست.",
  })
  namad_id: string;

  @IsString()
  @IsNotEmpty({
    message: "وارد کردن کد اینماد الزامیست.",
  })
  namad_code: string;
}
