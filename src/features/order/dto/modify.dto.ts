import { IsNotEmpty, IsString, IsArray } from "class-validator";

export class ModifyOrderItemsDto {
  @IsArray()
  @IsNotEmpty({
    message: "محصولی انتخاب نشده است.",
  })
  products: { product_id: string; quantity: number; price_index: number }[];

  @IsString()
  @IsNotEmpty({
    message: "مجموعه تعیین نشده است.",
  })
  complex_id: string;

  @IsString()
  @IsNotEmpty({
    message: "سفارش تعیین نشده است.",
  })
  order_id: string;
}
