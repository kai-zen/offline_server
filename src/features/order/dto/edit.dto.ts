import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

export class EditOrderDto {
  @IsNumber()
  @IsNotEmpty()
  status: 1 | 2 | 3 | 4 | 5 | 6 | 7;

  @IsString()
  @IsOptional()
  cash_bank?: string;
}

export class EditOrderPaymentsDto {
  @IsArray()
  @IsOptional()
  payments: { type: number; amount: number }[];

  @IsString()
  @IsOptional()
  cash_bank?: string;
}

// 1."ثبت شده"
// 2."در حال آماده سازی"
// 3."در حال ارسال"
// 4."تحویل شده"
// 5."رد شده"
// 6."لغو شده"
