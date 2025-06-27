import { Type } from "class-transformer";
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from "class-validator";

class SettingsOptions {
  @IsBoolean()
  show_logo: boolean;

  @IsBoolean()
  show_site_qr: boolean;

  @IsBoolean()
  show_user_address: boolean;

  @IsBoolean()
  show_complex_address: boolean;

  @IsBoolean()
  show_complex_phone: boolean;

  @IsBoolean()
  show_complex_site: boolean;

  @IsBoolean()
  show_shipping_type: boolean;
}

export class CreatePrinterDto {
  @IsString({ message: "نام باید یک رشته باشد" })
  @IsNotEmpty({ message: "نام پرینتر تعیین نشده است." })
  name: string;

  @IsString({ message: "عنوان باید یک رشته باشد" })
  @IsNotEmpty({ message: "عنوان پرینتر تعیین نشده است." })
  title: string;

  @IsString({ message: "عرض کاغذ باید یک رشته باشد" })
  @IsNotEmpty({ message: "وارد کردن عرض کاغذ الزامیست." })
  paper_width: string;

  @IsString({ message: "فواصل کاغذ باید یک رشته باشد" })
  @IsOptional()
  custom_margin: string;

  @IsNumber({}, { message: "نوع فاکتور باید یک عدد باشد" })
  @IsNotEmpty({ message: "عرض کاغذ تعیین نشده است." })
  factor_type: number;

  @IsArray({ message: "فولدرها باید یک آرایه باشد" })
  @IsOptional()
  folders: string[];

  @IsArray({ message: "محوطه‌ها باید یک آرایه باشد" })
  @IsOptional()
  areas: string[];

  @IsArray({ message: "انواع باید یک آرایه از اعداد باشد" })
  types: number[];

  @IsBoolean()
  is_common: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => SettingsOptions)
  settings_options: SettingsOptions | null;

  @IsBoolean()
  @IsNotEmpty({ message: "وضعیت بارگزاری مشخص نشده است" })
  needs_upload: boolean;
}
