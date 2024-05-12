import { AccessLevel } from "src/helpers/decorators";
import { ShippingRangeService } from "./shipping-range.service";
import { Controller, Get, Put, UseGuards } from "@nestjs/common";
import { HasAccessGuard } from "src/guards/access.guard";

@Controller("shipping-range")
export class ShippingRangeController {
  constructor(private service: ShippingRangeService) {}

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
