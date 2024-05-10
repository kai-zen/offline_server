import { IsDateString, IsNotEmpty, IsNumber, Max, Min } from "class-validator";

export class EditDiscountDto {
  @IsNumber()
  @Min(0, { message: "حداقل درصد تخفیف باید صفر باشد" })
  @Max(100, { message: "حداکثر درصد تخفیف باید صد باشد" })
  @IsNotEmpty({
    message: "وارد کردن درصد تخفیف الزامیست.",
  })
  percent: number;

  @IsDateString()
  start_date: Date;

  @IsDateString()
  expiration_date: Date;
}
