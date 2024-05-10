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
    if (user && user.access_level > 1) return true;
    const complexId =
      request.query.complexId ||
      request.body.complex_id ||
      request.params.complexId;
    if (complexId && user) {
      const theAccess = await this.accessService.hasAccess(
        user._id,
        complexId,
        types
      );
      if (theAccess) return true;
    }
    throw new ForbiddenException(messages[403]);
  }
}

// export const complexRoles = [
//   {
//     id: 1,
//     title: "مدیر مجموعه",
//   },
//   {
//     id: 2,
//     title: "دستیار مدیریت",
//   },
//   {
//     id: 3,
//     title: "حسابدار",
//   },
//   {
//     id: 4,
//     title: "صندوق‌دار",
//   },
//   {
//     id: 5,
//     title: "سرآشپز",
//   },
//   {
//     id: 6,
//     title: "آشپز",
//   },
//   {
//     id: 7,
//     title: "سالن دار",
//   },
//   {
//     id: 8,
//     title: "گارسون",
//   },
//   {
//     id: 9,
//     title: "پیک",
//   },
//   {
//     id: 10,
//     title: "ادمین محتوا",
//   },
// ];
