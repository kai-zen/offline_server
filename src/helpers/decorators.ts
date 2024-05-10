import { SetMetadata } from "@nestjs/common";

export const AccessLevel = (accessLevel: number[]) =>
  SetMetadata("types", accessLevel);
