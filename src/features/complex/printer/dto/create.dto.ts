import {
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  IsNotEmpty,
  IsOptional,
} from "class-validator";

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

  @IsBoolean({ message: "وضعیت مشترک باید یک مقدار منطقی باشد" })
  is_common: boolean;
}
