import { IsNotEmpty, IsString } from "class-validator";

export class EditDeliveryDto {
  @IsString()
  @IsNotEmpty({ message: "پیک تعیین نشده است." })
  access_id: string;

  @IsString()
  @IsNotEmpty({
    message: "مجموعه تعیین نشده است.",
  })
  complex_id: string;
}
