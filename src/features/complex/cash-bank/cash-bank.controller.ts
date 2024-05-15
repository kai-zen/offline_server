import { Controller, Get, Put } from "@nestjs/common";
import { CashBankService } from "./cash-bank.service";

@Controller("cash-bank")
export class CashBankController {
  constructor(private service: CashBankService) {}

  @Get()
  async findAll() {
    return await this.service.findAll();
  }

  @Put()
  async updateData() {
    return await this.service.updateData();
  }
}
