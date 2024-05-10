import {
  IsNotEmpty,
  Length,
  IsString,
  IsLatitude,
  IsLongitude,
  IsBoolean,
} from "class-validator";

export class UpdateAddressDto {
  @IsString()
  @IsNotEmpty({
    message: "وارد کردن نام شعبه الزامیست.",
  })
  name: string;

  @IsString()
  @IsNotEmpty({
    message: "وارد کردن توضیحات آدرس شعبه الزامیست.",
  })
  @Length(10, 120, {
    message: "توضیحات آدرس شعبه باید بین ده تا صد و بیست حرف باشد.",
  })
  description: string;

  @IsString()
  phone: string;

  @IsString()
  @IsNotEmpty({
    message: "وارد کردن شهر الزامیست.",
  })
  city_id: string;

  @IsBoolean()
  has_sale: boolean;

  @IsBoolean()
  has_reserve: boolean;

  @IsBoolean()
  auto_copy_addresses: boolean;

  @IsLatitude({
    message: "عرض جغرافیایی وارد شده معتبر نیست.",
  })
  latitude: number;

  @IsLongitude({
    message: "طول جغرافیایی وارد شده معتبر نیست.",
  })
  longitude: number;
}
