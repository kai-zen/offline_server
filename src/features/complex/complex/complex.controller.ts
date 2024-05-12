import { ComplexService } from "./comlex.service";
import { IsOwnerGuard } from "src/guards/owner.guard";
import { Controller, Get, Put, UseGuards } from "@nestjs/common";

@Controller("complex")
export class ComplexController {
  constructor(private readonly service: ComplexService) {}

  @Get()
  async find() {
    return await this.service.findTheComplex();
  }

  @Put()
  @UseGuards(IsOwnerGuard)
  async updateData() {
    return await this.service.updateData();
  }
}
