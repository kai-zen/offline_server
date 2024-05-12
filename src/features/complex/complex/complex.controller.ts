import { ComplexService } from "./comlex.service";
import { IsOwnerGuard } from "src/guards/owner.guard";
import { Controller, Get, Put, UseGuards } from "@nestjs/common";

@Controller("complex")
export class ComplexController {
  constructor(private readonly service: ComplexService) {}

  @Get()
  async findAll() {
    return await this.service.findTheComplex();
  }

  @Put()
  @UseGuards(IsOwnerGuard)
  async findByTags() {
    return await this.service.updateData();
  }
}
