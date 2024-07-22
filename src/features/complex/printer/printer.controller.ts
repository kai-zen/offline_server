import { Controller, Delete, Get, Param, Put, UseGuards } from "@nestjs/common";
import { PrinterService } from "./printer.service";
import { AccessLevel } from "src/helpers/decorators";
import { HasAccessGuard } from "src/guards/access.guard";

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

  @Delete("/:complexId/:id")
  @AccessLevel([1, 2, 3, 4])
  @UseGuards(HasAccessGuard)
  async deleteRecord(@Param("id") recordId: string) {
    await this.service.deleteOne(recordId);
    return "success";
  }
}
