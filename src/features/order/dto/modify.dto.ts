import { IsNotEmpty, IsString, IsArray, IsOptional } from "class-validator";
import { OrderProductItemDataType } from "../service/C/by-emp.service";

export class ModifyOrderItemsDto {
  @IsArray()
  @IsNotEmpty({
    message: "محصولی انتخاب نشده است.",
  })
  products: OrderProductItemDataType[];

  @IsString()
  @IsOptional()
  description: string;

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
