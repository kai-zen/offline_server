import ProductModule from "src/features/product/product/product.module";
import UserModule from "src/features/user/users/user.module";
import { ComplexUsersActionsService } from "./service/complex-user-actions.service";
import { ComplexUserSchema } from "./complex-users.schema";
import { ComplexUsersController } from "./complex-user.controller";
import { ComplexUsersFetchService } from "./service/complex-user-fetch.service";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import MessageModule from "src/features/management/messages/message.module";
import { BullModule } from "@nestjs/bull";
import { GiveDiscountProcessor } from "./complex-user.consumer";

const ComplexUser = MongooseModule.forFeature([
  { name: "complex-user", schema: ComplexUserSchema },
]);

@Module({
  imports: [
    ComplexUser,
    UserModule,
    ProductModule,
    MessageModule,
    BullModule.registerQueue({
      name: "give_discount",
    }),
  ],
  controllers: [ComplexUsersController],
  providers: [
    ComplexUsersActionsService,
    ComplexUsersFetchService,
    GiveDiscountProcessor,
  ],
  exports: [ComplexUsersActionsService, ComplexUsersFetchService],
})
export default class ComplexUserModule {}
