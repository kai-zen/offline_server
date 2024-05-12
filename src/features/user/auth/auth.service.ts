import { AccessService } from "../access/access.service";
import { ComplexFetchService } from "src/features/complex/complex/comlex.service";
import { ComplexUsersActionsService } from "./../../complex/users/service/complex-user-actions.service";
import { JwtService } from "@nestjs/jwt";
import { messages } from "src/helpers/constants";
import { UserService } from "../users/user.service";
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ComplexPutService } from "src/features/complex/complex/service/complex-put.service";
import { ActivityService } from "src/features/complex/activities/activities.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly complexService: ComplexFetchService,
    private readonly complexPutService: ComplexPutService,
    private readonly complexUsersActionsService: ComplexUsersActionsService,
    private readonly accessService: AccessService,
    private readonly logService: ActivityService
  ) {}

  async sendCode(mobile: string) {
    let user = await this.userService.findByMobile(mobile);
    if (!user) user = await this.userService.createUser(mobile);
    await this.userService.setLoginCode(user._id);
    return mobile;
  }

  async login(data: { mobile: string; code: string }) {
    const { mobile, code } = data || {};
    const user = await this.userService.findByMobile(mobile);
    if (!user) throw new NotFoundException(messages[404]);
    if (code !== user.auth_code)
      throw new BadRequestException("کد وارد شده اشتباه است.");
    const token = await this.jwtService.signAsync(user.toObject());
    await this.userService.setLoginCode(user._id, true);
    return { user, token };
  }

  async registerUser(mobile: string) {
    return await this.userService.createUser(mobile);
  }

  async complexLogin(data: {
    mobile: string;
    code: string;
    complex_id: string;
  }) {
    const { mobile, code, complex_id } = data || {};
    const user = await this.userService.findByMobile(mobile);
    if (!user) throw new NotFoundException(messages[404]);
    if (code !== user.auth_code)
      throw new BadRequestException("کد وارد شده اشتباه است.");

    await this.complexPutService.chargeSms({
      complex_id,
      used_count: 1,
    });

    await this.complexUsersActionsService.userLoggedIn({
      user_id: user._id.toString(),
      complex_id,
    });

    const token = await this.jwtService.signAsync(user.toObject());
    return { user, token };
  }

  async panelLogin(data: { mobile: string; code: string; username: string }) {
    const { mobile, code, username } = data || {};
    const user = await this.userService.findByMobile(mobile);
    if (!user) throw new NotFoundException(messages[404]);
    if (code !== user.auth_code)
      throw new BadRequestException("کد وارد شده اشتباه است.");

    const theAccess = await this.accessService.findByComplexAndUser({
      username,
      user: user._id.toString(),
    });
    if (!theAccess) throw new ForbiddenException(messages[403]);

    const theComplex = await this.complexService.findByUsername(username);
    if (!theComplex) throw new NotFoundException(messages[404]);

    await this.complexPutService.chargeSms({
      complex_id: theComplex._id.toString(),
      used_count: 1,
    });

    await this.logService.create({
      type: 1,
      complex_id: theComplex._id.toString(),
      description: "کاربر وارد حساب شد.",
      user_id: user._id.toString(),
    });

    const token = await this.jwtService.signAsync(user.toObject());
    return {
      user,
      token,
      complex: theComplex,
      access: theAccess.type,
    };
  }
}
