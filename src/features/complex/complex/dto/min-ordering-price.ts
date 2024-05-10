import { IsNotEmpty, IsNumber, Min } from "class-validator";

export class UpdateComplexMinOrderingPriceDto {
  @IsNumber()
  @Min(0, { message: "حداقل مبلغ تعیین شده باید 0 باشد" })
  @IsNotEmpty({
    message: "وارد کردن حداقل مبلغ سفارش آنلاین الزامیست.",
  })
  min_order_price: number;
}
