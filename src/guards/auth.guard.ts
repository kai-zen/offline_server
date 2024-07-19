import { messages } from "src/helpers/constants";
import { Request } from "express";
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from "@nestjs/common";

@Injectable()
export class IsLoggedInGuard implements CanActivate {
  constructor() {}

  canActivate(context: ExecutionContext): boolean {
    const request: Request = context.switchToHttp().getRequest();
    const user = request.currentUser;
    if (user) return true;
    throw new ForbiddenException(messages[403]);
  }
}
