import { messages } from "src/helpers/constants";
import { Request } from "express";
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from "@nestjs/common";
import { ComplexService } from "src/features/complex/complex/comlex.service";

@Injectable()
export class IsOwnerGuard implements CanActivate {
  constructor(private complexService: ComplexService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const user = request.currentUser;
    const complexId =
      request.body?.complex_id ||
      request.query?.complex_id ||
      request.params?.complexId;

    if (user && complexId) {
      const isOwner = await this.complexService.isOwner(user._id, complexId);
      if (isOwner) return true;
    }
    throw new ForbiddenException(messages[403]);
  }
}
