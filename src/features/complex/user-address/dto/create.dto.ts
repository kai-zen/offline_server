import { IsNotEmpty, IsString, IsLatitude, IsLongitude } from "class-validator";

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
  @IsNotEmpty({ message: "کاربر تعیین نشده است." })
  user_id: string;

  @IsString()
  @IsNotEmpty({ message: "مجموعه تعیین نشده است." })
  complex_id: string;

  @IsLatitude({
    message: "عرض جغرافیایی وارد شده معتبر نیست.",
  })
  latitude: number;

  @IsLongitude({
    message: "طول جغرافیایی وارد شده معتبر نیست.",
  })
  longitude: number;
}
