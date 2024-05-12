import { AccessLevel } from "src/helpers/decorators";
import { Controller, Get, Put, UseGuards } from "@nestjs/common";
import { HasAccessGuard } from "src/guards/access.guard";
import { CashBankService } from "./cash-bank.service";

@Controller("cash-bank")
export class CashBankController {
  constructor(private service: CashBankService) {}

  @Get()
  @AccessLevel([1, 2, 3, 4])
  @UseGuards(HasAccessGuard)
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
