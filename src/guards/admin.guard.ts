import { messages } from "src/helpers/constants";
import { Request } from "express";
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from "@nestjs/common";

@Injectable()
export class IsAdminGuard implements CanActivate {
  constructor() {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const user = request.currentUser;
    if (user && user.access_level > 1) return true;
    throw new ForbiddenException(messages[403]);
  }
}
