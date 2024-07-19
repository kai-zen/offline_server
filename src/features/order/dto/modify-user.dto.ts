import { IsNotEmpty, IsString } from "class-validator";

export class ChangeOrderUserDto {
  @IsString()
  @IsNotEmpty({ message: "مجموعه تعیین نشده است." })
  complex_id: string;

  @IsString()
  @IsNotEmpty({ message: "موبایل کاربر تعیین نشده است." })
  mobile: string;

  @IsString()
  @IsNotEmpty({ message: "شناسه سفارش وارد نشده است." })
  order_id: string;
}
