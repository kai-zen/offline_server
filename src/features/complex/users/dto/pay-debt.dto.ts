import { IsArray, IsNotEmpty, IsString } from "class-validator";

export class PayDebtDto {
  @IsArray()
  @IsNotEmpty()
  order_ids: string[];

  @IsString()
  @IsNotEmpty({ message: "مجموعه تعیین نشده است." })
  complex_id: string;

  @IsString()
  @IsNotEmpty({ message: "کاربر تعیین نشده است." })
  user_id: string; // should be actual user id (not user complex id)
}
