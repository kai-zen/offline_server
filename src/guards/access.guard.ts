import { AccessService } from "src/features/user/access/access.service";
import { messages } from "src/helpers/constants";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from "@nestjs/common";

@Injectable()
export class HasAccessGuard implements CanActivate {
  constructor(
    private readonly accessService: AccessService,
    private reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const types = this.reflector.get<number[]>("types", context.getHandler());
    const request: Request = context.switchToHttp().getRequest();
    const user = request.currentUser;
    if (user) {
      const theAccess = await this.accessService.hasAccess(
        user._id as any,
        types
      );
      if (theAccess) return true;
    }
    throw new ForbiddenException(messages[403]);
  }
}
