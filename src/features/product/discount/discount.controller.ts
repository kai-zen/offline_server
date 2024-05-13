import { DiscountService } from "./discount.service";
import { Controller, Get, Put, UseGuards } from "@nestjs/common";
import { AccessLevel } from "src/helpers/decorators";
import { HasAccessGuard } from "src/guards/access.guard";

@Controller("discount")
export class DiscountController {
  constructor(private service: DiscountService) {}

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
