import { Controller, Get, Param, Put, Req } from "@nestjs/common";
import { CashBankService } from "./cash-bank.service";
import { Request } from "express";

@Controller("cash-bank")
export class CashBankController {
  constructor(private service: CashBankService) {}

  @Get()
  async findAll() {
    return await this.service.findAll();
  }

  @Get("/:complexId")
  async findBranchRanges() {
    return await this.service.findByComplex();
  }

  @Put()
  async updateData() {
    return await this.service.updateData();
  }

  @Put("/close/:complexId/:id")
  async closeCashbank(
    @Param("id") recordId: string,
    @Param("complexId") complexId: string,
    @Req() req: Request
  ) {
    const token = req.headers.authorization;
    return await this.service.closeCashBank({
      complex_id: complexId,
      id: recordId,
      token,
    });
  }
}
