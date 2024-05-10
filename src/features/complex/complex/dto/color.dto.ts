import { IsNotEmpty, IsString } from "class-validator";

export class UpdateColorDto {
  @IsString()
  @IsNotEmpty({
    message: "وارد کردن رنگ الزامیست.",
  })
  color: string;
}
