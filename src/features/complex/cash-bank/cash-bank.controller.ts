import { Controller, Get, Put } from "@nestjs/common";
import { CashBankService } from "./cash-bank.service";

@Controller("cash-bank")
export class CashBankController {
  constructor(private service: CashBankService) {}

  @Get()
  async findAll() {
    return await this.service.findAll();
  }

  @Get("/:complexId") // *
  async findBranchRanges() {
    return await this.service.findByComplex();
  }

  @Put()
  async updateData() {
    return await this.service.updateData();
  }
}
