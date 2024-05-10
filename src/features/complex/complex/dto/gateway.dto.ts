import { IsNotEmpty, IsString } from "class-validator";

export class UpdateGatewayDto {
  @IsString()
  @IsNotEmpty({
    message: "وارد کردن آیدی درگاه الزامیست.",
  })
  gate_id: string;
}
