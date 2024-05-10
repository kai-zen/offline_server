import { messages } from "src/helpers/constants";
import { Request } from "express";
import {
  CanActivate,
  UnauthorizedException,
  ExecutionContext,
  Injectable,
} from "@nestjs/common";

@Injectable()
export class IsLoggedInGuard implements CanActivate {
  constructor() {}

  canActivate(context: ExecutionContext): boolean {
    const request: Request = context.switchToHttp().getRequest();
    const user = request.currentUser;
    if (user) return true;
    throw new UnauthorizedException(messages[401]);
  }
}
