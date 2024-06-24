import {
  ArrayNotEmpty,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

class Category {
  @IsString()
  name: string;

  @IsNumber()
  row: number;

  @IsString()
  _id: string;
}

class Printer {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsString()
  name: string;

  @IsString()
  title: string;

  @IsString()
  paper_width: string;

  @IsString()
  factor_type: string;

  @ValidateNested({ each: true })
  categories: Category[];

  @ArrayNotEmpty()
  types: number[];

  @IsBoolean()
  is_common: boolean;
}

export class PrintDto {
  @ValidateNested()
  printer: Printer;

  @ArrayNotEmpty()
  receipt: any[];
}
