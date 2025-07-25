import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsObject,
  IsOptional,
  IsArray,
} from "class-validator";
import { OrderProductItemDataType } from "../service/C/by-emp.service";

export class CreateOrderDto {
  @IsNumber()
  @IsOptional()
  order_type: 1 | 2; // سایت - تلفنی - حضوری

  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  user_phone?: string;

  @IsObject()
  @IsOptional()
  user_address?: {
    name: string;
    description: string;
    latitude: number;
    longitude: number;
    details: string;
    phone_number: string;
  };

  @IsArray()
  @IsNotEmpty({ message: "محصولی انتخاب نشده است." })
  products: OrderProductItemDataType[];

  @IsString()
  @IsOptional()
  table_number: string;

  @IsNumber()
  @IsOptional()
  people_count: number;

  @IsString()
  @IsOptional()
  cashbank_id: string;

  @IsNumber()
  @IsOptional()
  shpipping_price?: number;

  @IsNumber()
  @IsOptional()
  extra_price?: number;

  @IsNumber()
  @IsOptional()
  user_discount?: number;

  @IsString()
  @IsOptional()
  navigation_link?: string;

  @IsString()
  @IsNotEmpty({ message: "مجموعه تعیین نشده است." })
  complex_id: string;

  @IsNumber()
  @IsOptional()
  tip?: number;
}

// 1."ثبت شده"
// 2."در حال آماده سازی"
// 3."در حال ارسال"
// 4."تحویل شده"
// 5."رد شده"
// 6."لغو شده"
