import { ArrayMaxSize, IsArray } from "class-validator";

export class UpdateComplexPromotedProductsDto {
  @IsArray()
  @ArrayMaxSize(3, { message: "حداکثر تعداد محصولات باید 3 عدد باشد" })
  products: string[];
}
