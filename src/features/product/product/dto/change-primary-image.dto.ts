import { IsNotEmpty, IsNumber } from "class-validator";

export class EditPrimaryImageIndexDto {
  @IsNumber()
  @IsNotEmpty({
    message: "تعیین کردن تصویر جدید الزامیست.",
  })
  new_index: number;
}
