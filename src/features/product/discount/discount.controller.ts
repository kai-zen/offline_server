import { DiscountService } from "./discount.service";
import { Controller, Get, Put } from "@nestjs/common";

@Controller("discount")
export class DiscountController {
  constructor(private service: DiscountService) {}

  @Get()
  async findAll() {
    return await this.service.findAll();
  }

  @Put()
  async updateData() {
    return await this.service.updateData();
  }
}
