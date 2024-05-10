import { IsBoolean } from "class-validator";

export class UpdateComplexSettingsDto {
  @IsBoolean()
  has_sale: boolean;

  @IsBoolean()
  has_reserve: boolean;

  @IsBoolean()
  auto_copy_addresses: boolean;
}
