import { ComplexFetchService } from "src/features/complex/complex/service/comlex-fetch.service";
import { messages } from "src/helpers/constants";
import { Request } from "express";
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from "@nestjs/common";

@Injectable()
export class IsOwnerGuard implements CanActivate {
  constructor(private complexService: ComplexFetchService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const user = request.currentUser;
    if (user && user.access_level > 1) return true;
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
