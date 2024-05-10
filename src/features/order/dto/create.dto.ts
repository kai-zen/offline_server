import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsObject,
  IsOptional,
  IsArray,
  IsBoolean,
} from "class-validator";

export class CreateOrderDto {
  @IsNumber()
  @IsOptional()
  order_type: 1 | 2 | 3; // سایت - تلفنی - حضوری

  @IsNumber()
  @IsOptional()
  payment_type: 1 | 2 | 3 | 4 | 5 | 6;

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
  };

  @IsArray()
  @IsNotEmpty({
    message: "محصولی انتخاب نشده است.",
  })
  products: { product_id: string; quantity: number; price_index: number }[];

  @IsString()
  @IsOptional()
  discount_id: string;

  @IsString()
  @IsOptional()
  table_number: string;

  @IsString()
  @IsOptional()
  cashbank_id: string;

  @IsBoolean()
  needs_pack: boolean;

  @IsBoolean()
  is_platform: boolean;

  @IsNumber()
  @IsOptional()
  shpipping_price?: number;

  @IsString()
  @IsNotEmpty({
    message: "مجموعه تعیین نشده است.",
  })
  complex_id: string;
}

// 1."ثبت شده"
// 2."در حال آماده سازی"
// 3."در حال ارسال"
// 4."تحویل شده"
// 5."رد شده"
// 6."لغو شده"
