import { AuthService } from "./auth.service";
import { Body, Controller, Param, Post } from "@nestjs/common";
import { LoginDto } from "./dtos/login.dto";
import { PanelLoginDto } from "./dtos/panel-login.dto";
import { SendCodeDto } from "./dtos/send-code.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post("send-code")
  async sendCode(@Body() body: SendCodeDto) {
    return await this.service.sendCode(body.mobile);
  }

  @Post("resend-code")
  async resendCode(@Body() body: SendCodeDto) {
    return await this.service.sendCode(body.mobile);
  }

  @Post("login")
  async login(@Body() body: LoginDto) {
    return this.service.login(body);
  }

  @Post("login/complex/:complexId")
  async complexLogin(
    @Body() body: LoginDto,
    @Param("complexId") complexId: string
  ) {
    return this.service.complexLogin({ ...body, complex_id: complexId });
  }

  @Post("login/panel")
  async panelLogin(@Body() body: PanelLoginDto) {
    const { mobile, code, complex } = body || {};
    return this.service.panelLogin({ mobile, code, username: complex });
  }
}
