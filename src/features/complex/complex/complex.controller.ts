import { ComplexService } from "./comlex.service";
import { Controller, Get, Put } from "@nestjs/common";

@Controller("complex")
export class ComplexController {
  constructor(private readonly service: ComplexService) {}

  @Get("/last-local-updates") // *
  async findLastLocalUpdate() {
    return await this.service.getLastUpdates();
  }

  @Get("/:complexId") // *
  async find() {
    return await this.service.findTheComplex();
  }

  @Put() // *
  async updateData() {
    return await this.service.updateData();
  }
}
