import { CurrentUserMiddleware } from "./middlewares/current-user.middleware";
import { JwtService } from "@nestjs/jwt";
import { MiddlewareConsumer, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UserController } from "./user.controller";
import { UserSchema } from "./user.schema";
import { UserService } from "./user.service";

const User = MongooseModule.forFeature([{ name: "user", schema: UserSchema }]);

@Module({
  imports: [User],
  controllers: [UserController],
  providers: [UserService, JwtService],
  exports: [UserService],
})
export default class UserModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CurrentUserMiddleware).forRoutes("*");
  }
}
