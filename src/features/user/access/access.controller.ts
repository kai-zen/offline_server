import { AccessService } from "./access.service";
import { Controller, Get, Put, UseGuards } from "@nestjs/common";
import { HasAccessGuard } from "src/guards/access.guard";
import { AccessLevel } from "src/helpers/decorators";

@Controller("access")
export class AccessController {
  constructor(private service: AccessService) {}

  @Get()
  async findAll() {
    return await this.service.findAll();
  }

  @Put()
  @AccessLevel([1, 2])
  @UseGuards(HasAccessGuard)
  async updateData() {
    return await this.service.updateData();
  }
}
