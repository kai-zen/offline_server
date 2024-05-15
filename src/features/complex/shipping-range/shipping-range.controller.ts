import { ShippingRangeService } from "./shipping-range.service";
import { Controller, Get, Put } from "@nestjs/common";

@Controller("shipping-range")
export class ShippingRangeController {
  constructor(private service: ShippingRangeService) {}

  @Get()
  async findAll() {
    return await this.service.findAll();
  }

  @Put()
  async updateData() {
    return await this.service.updateData();
  }
}
