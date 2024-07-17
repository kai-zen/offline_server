import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ShiftSchema } from "./shift.schema";
import { ShiftController } from "./shift.controller";
import { ShiftService } from "./shift.service";
import OrderModule from "src/features/order/order.module";

const Shift = MongooseModule.forFeature([
  { name: "shift", schema: ShiftSchema },
]);

@Module({
  imports: [Shift, forwardRef(() => OrderModule)],
  controllers: [ShiftController],
  providers: [ShiftService],
  exports: [ShiftService],
})
export default class ShiftModule {}
