import {
  IsNotEmpty,
  IsString,
  IsObject,
  IsOptional,
  IsNumber,
} from "class-validator";

export class EditAddressDto {
  @IsObject()
  @IsOptional()
  address: {
    address_id: string;
    name: string;
    description: string;
    latitude: number;
    longitude: number;
    phone_number: string;
    details: string;
  } | null;

  @IsString()
  @IsNotEmpty({
    message: "مجموعه تعیین نشده است.",
  })
  complex_id: string;

  @IsNumber()
  @IsOptional()
  shipping_price?: number;
}
