import { IsNotEmpty, IsString, Length, Matches } from "class-validator";

export class EditComplexDto {
  @IsString()
  @IsNotEmpty({
    message: "وارد کردن نام مجموعه الزامیست.",
  })
  name: string;

  @IsString()
  category: string;

  @IsString()
  @IsNotEmpty({
    message: "وارد کردن کد ورود الزامیست.",
  })
  @Length(10, 350, {
    message: "توضیحات مجموعه باید بین ده تا سیصد و پنجاه حرف باشد.",
  })
  description: string;

  @IsString()
  @IsNotEmpty({
    message: "لطفا نام کاربری مجموعه خود را وارد کنید.",
  })
  @Matches(/^[a-zA-Z0-9._]{1,30}$/, {
    message: "نام کاربری مجموعه باید شامل اعداد و حروف انگلیسی، یا _ و . باشد.",
  })
  username: string;
}
