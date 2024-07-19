import { Controller, Get, Put } from "@nestjs/common";
import { PrinterService } from "./printer.service";

@Controller("printer")
export class PrinterController {
  constructor(private service: PrinterService) {}

  @Get()
  async findAll() {
    return await this.service.findAll();
  }

  @Get("/:complexId")
  async findByComplex() {
    return await this.service.findAll();
  }

  @Put()
  async updateData() {
    return await this.service.updateData();
  }
}
