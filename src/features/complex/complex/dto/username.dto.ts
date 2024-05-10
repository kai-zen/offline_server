import { IsNotEmpty, IsString } from "class-validator";

export class UpdateUsernameDto {
  @IsString()
  @IsNotEmpty({
    message: "وارد کردن نام کاربری جدید الزامیست.",
  })
  username: string;
}
