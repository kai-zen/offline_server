import { IsArray, IsNotEmpty } from "class-validator";

export class reorderCategoriesDto {
  @IsArray()
  @IsNotEmpty()
  categories: { id: string; row: number }[];
}
