import { JwtService } from "@nestjs/jwt";
import { NextFunction, Request, Response } from "express";
import { UserDocument } from "../user.schema";
import { UserService } from "../user.service";
import { ForbiddenException, Injectable, NestMiddleware } from "@nestjs/common";
import { messages } from "src/helpers/constants";

declare global {
  namespace Express {
    interface Request {
      currentUser?: UserDocument;
    }
  }
}

@Injectable()
export class CurrentUserMiddleware implements NestMiddleware {
  constructor(
    private userService: UserService,
    private jwtService: JwtService
  ) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const [type, token] =
      (req.headers.localauthorization as string)?.split(" ") || [];
    if (type === "Bearer") {
      try {
        const tokenData = await this.jwtService.verifyAsync(token, {
          secret: process.env.JWT_SECRET,
        });
        const user = await this.userService.findById(tokenData._id);
        if (user) req.currentUser = user;
      } catch {
        throw new ForbiddenException(messages[403]);
      }
    }
    next();
  }
}
