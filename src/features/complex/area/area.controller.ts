import { Controller, Get, Put } from "@nestjs/common";
import { AreaService } from "./area.service";

@Controller("area")
export class AreaController {
  constructor(private service: AreaService) {}

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
