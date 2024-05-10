import { IsNotEmpty, IsNumber } from "class-validator";

export class UpdateSmsDto {
  @IsNumber()
  @IsNotEmpty({
    message: "وارد کردن تعداد الزامیست.",
  })
  budget: number;
}
