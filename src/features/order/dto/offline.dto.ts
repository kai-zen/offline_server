import { Type } from "class-transformer";
import {
  IsNotEmpty,
  IsNumber,
  IsArray,
  IsString,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsIn,
  ValidateNested,
  IsBoolean,
  IsOptional,
  IsDateString,
} from "class-validator";

class Product {
  @IsString({ message: "شناسه محصول باید یک رشته باشد" })
  product_id: string;

  @IsInt({ message: "تعداد باید یک عدد صحیح باشد" })
  quantity: number;

  @IsInt({ message: "شاخص قیمت باید یک عدد صحیح باشد" })
  price_index: number;
}

class UserAddress {
  @IsString({ message: "نام باید یک رشته باشد" })
  name: string;

  @IsString({ message: "توضیحات باید یک رشته باشد" })
  description: string;

  @IsLatitude({ message: "عرض جغرافیایی باید یک عدد معتبر باشد" })
  latitude: number;

  @IsLongitude({ message: "طول جغرافیایی باید یک عدد معتبر باشد" })
  longitude: number;
}

export class Order {
  @IsInt({ message: "نوع سفارش باید یک عدد صحیح باشد" })
  @IsIn([1, 2, 3], { message: "نوع سفارش باید ۱، ۲، یا ۳ باشد" })
  order_type: 1 | 2 | 3;

  @IsInt({ message: "نوع پرداخت باید یک عدد صحیح باشد" })
  @IsIn([1, 2, 3, 4, 5, 6], { message: "نوع پرداخت باید بین ۱ تا ۶ باشد" })
  payment_type: 1 | 2 | 3 | 4 | 5 | 6;

  @IsInt({ message: "وضعیت سفارش باید یک عدد صحیح باشد" })
  @IsIn([1, 2, 3, 4, 5, 6, 7], { message: "وضعیت سفارش باید مشخص باشد" })
  status: 1 | 2 | 3 | 4 | 5 | 6 | 7;

  @IsString({ message: "توضیحات باید یک رشته باشد" })
  description: string;

  @IsArray({ message: "محصولات باید یک آرایه باشد" })
  @ValidateNested({ each: true, message: "هر محصول باید از نوع معتبر باشد" })
  @Type(() => Product)
  products: Product[];

  @IsBoolean({ message: "وضعیت بسته‌بندی باید یک مقدار بولی باشد" })
  needs_pack: boolean;

  @IsOptional()
  @ValidateNested({ message: "آدرس کاربر باید از نوع معتبر باشد یا خالی" })
  @Type(() => UserAddress)
  user_address: UserAddress | null;

  @IsOptional()
  @IsString({ message: "شناسه صندوق باید یک رشته باشد" })
  cashbank_id?: string;

  @IsDateString({}, { message: "تاریخ ایجاد باید یک تاریخ معتبر باشد" })
  created_at: string;

  // prices
  @IsNumber({}, { message: "قیمت حمل باید یک عدد باشد" })
  shipping_price: number;

  @IsNumber({}, { message: "قیمت بسته‌بندی باید یک عدد باشد" })
  packing_price: number;

  @IsNumber({}, { message: "تخفیف کاربر باید یک عدد باشد" })
  user_discount: number;

  @IsNumber({}, { message: "قیمت اضافی باید یک عدد باشد" })
  extra_price: number;

  @IsNumber({}, { message: "حق سرویس باید یک عدد باشد" })
  service: number;

  @IsNumber({}, { message: "تخفیف مجموعه باید یک عدد باشد" })
  complex_discount: number;

  @IsOptional()
  @IsString({ message: "شماره تلفن کاربر باید یک رشته باشد" })
  user_phone?: string;

  @IsOptional()
  @IsString({ message: "شماره میز باید یک رشته باشد" })
  table_number?: string;
}

export class LoadOfflineOrdersDto {
  @IsString({ message: "مجموعه باید رشته باشد" })
  @IsNotEmpty({
    message: "مجموعه تعیین نشده است.",
  })
  complex_id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Order)
  orders: Order[];
}
