import { IsDateString, IsNotEmpty } from "class-validator";

export class UpdateExpirationDateDto {
  @IsDateString()
  @IsNotEmpty({
    message: "وارد کردن تاریخ انقضا الزامیست.",
  })
  expiration_date: Date;
}
