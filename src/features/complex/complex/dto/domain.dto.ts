import { IsNotEmpty, IsString } from "class-validator";

export class UpdateDomainDto {
  @IsString()
  @IsNotEmpty({
    message: "وارد کردن دامنه الزامیست.",
  })
  domain: string;
}
