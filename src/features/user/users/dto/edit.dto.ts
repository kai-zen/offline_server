import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from "class-validator";

export class EditProfileDto {
  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  @IsNotEmpty({
    message: "لطفا نام کاربری خود را وارد کنید.",
  })
  @Matches(/^[a-zA-Z0-9._]{1,30}$/, {
    message: "نام کاربری باید شامل اعداد و حروف انگلیسی، یا _ و . باشد.",
  })
  username: string;

  @IsEmail(undefined, { message: "ایمیل وارد شده اشتباه است." })
  @IsOptional()
  email: string;

  @IsString()
  @IsOptional()
  @Length(0, 250, {
    message: "بایو باید حداکثر دویست و پنجاه حرف باشد.",
  })
  bio: string;

  @IsDateString()
  @IsOptional()
  birthday: Date;
}
