import {
  IsNotEmpty,
  IsString,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsBoolean,
} from "class-validator";

export class CreateComplexUserAddressDto {
  @IsString()
  name: string;

  @IsString()
  @IsNotEmpty({
    message: "وارد کردن توضیحات آدرس الزامیست.",
  })
  description: string;

  @IsString()
  details: string;

  @IsString()
  @IsNotEmpty({ message: "مشتری تعیین نشده است." })
  user_id: string;

  @IsString()
  @IsNotEmpty({ message: "شماره تماس تعیین نشده است." })
  phone_number: string;

  @IsString()
  @IsNotEmpty({ message: "مجموعه تعیین نشده است." })
  complex_id: string;

  @IsLatitude({
    message: "عرض جغرافیایی وارد شده معتبر نیست.",
  })
  @IsOptional()
  latitude: number;

  @IsLongitude({
    message: "طول جغرافیایی وارد شده معتبر نیست.",
  })
  @IsOptional()
  longitude: number;

  @IsBoolean()
  @IsNotEmpty({ message: "وضعیت بارگزاری مشخص نشده است" })
  needs_upload: boolean;
}
