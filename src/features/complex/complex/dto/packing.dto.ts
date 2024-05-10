import { IsNotEmpty, IsNumber, Min } from "class-validator";

export class UpdateComplexPackingDto {
  @IsNumber()
  @Min(0, { message: "حداقل هزینه بسته بندی باید 0 باشد" })
  @IsNotEmpty({
    message: "وارد کردن آیدی درگاه الزامیست.",
  })
  packing_cost: number;
}
