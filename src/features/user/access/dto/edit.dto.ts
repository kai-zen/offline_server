import { IsNotEmpty, IsNumber } from "class-validator";

export class EditAccessDto {
  @IsNumber()
  @IsNotEmpty({ message: "سطح دسترسی مورد نظر خود را وارد کنید" })
  type: number;
}
