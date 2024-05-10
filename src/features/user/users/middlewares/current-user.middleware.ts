import { JwtService } from "@nestjs/jwt";
import { NextFunction, Request, Response } from "express";
import { UserDocument } from "../user.schema";
import { UserService } from "../user.service";
import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from "@nestjs/common";

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
    const [type, token] = req.headers.authorization?.split(" ") || [];
    if (type === "Bearer") {
      try {
        const tokenData = await this.jwtService.verifyAsync(token, {
          secret: process.env.JWT_SECRET,
        });
        const user = await this.userService.findById(tokenData._id);
        if (user) req.currentUser = user;
      } catch {
        throw new UnauthorizedException();
      }
    }
    next();
  }
}
