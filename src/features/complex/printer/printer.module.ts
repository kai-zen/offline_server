import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { HttpModule } from "@nestjs/axios";
import { PrinterController } from "./printer.controller";
import { PrinterService } from "./printer.service";
import { PrinterSchema } from "./printer.schema";

const Printer = MongooseModule.forFeature([
  { name: "printer", schema: PrinterSchema },
]);

@Module({
  imports: [Printer, HttpModule],
  controllers: [PrinterController],
  providers: [PrinterService],
  exports: [PrinterService],
})
export default class PrinterModule {}
