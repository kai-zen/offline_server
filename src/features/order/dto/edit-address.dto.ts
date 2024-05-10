import { IsNotEmpty, IsString, IsObject, IsOptional } from "class-validator";

export class EditAddressDto {
  @IsObject()
  @IsOptional()
  address: {
    name: string;
    description: string;
    latitude: number;
    longitude: number;
  } | null;

  @IsString()
  @IsNotEmpty({
    message: "مجموعه تعیین نشده است.",
  })
  complex_id: string;
}
