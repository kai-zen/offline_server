import { IsArray } from "class-validator";

export class UpdateComplexTagsDto {
  @IsArray()
  tags: string[];
}
