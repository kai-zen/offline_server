import { IsNotEmpty, IsString } from "class-validator";

export class CreateCashBankDto {
  @IsString()
  @IsNotEmpty({ message: "وارد کردن عنوان صندوق الزامیت." })
  name: string;
}
