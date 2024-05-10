import AccessModule from "../access/access.module";
import ComplexModule from "src/features/complex/complex/complex.module";
import ComplexUserModule from "src/features/complex/users/complex-user.module";
import UserModule from "../users/user.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { Module } from "@nestjs/common";

@Module({
  imports: [
    UserModule,
    AccessModule,
    ComplexModule,
    ComplexUserModule,
    JwtModule.registerAsync({
      global: true,
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get("JWT_SECRET"),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],

  providers: [AuthService],
  exports: [AuthService],
})
export default class AuthModule {}
