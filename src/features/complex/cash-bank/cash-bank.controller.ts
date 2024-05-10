import { AccessLevel } from "src/helpers/decorators";
import { CreateCashBankDto } from "./dto/create.dto";
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from "@nestjs/common";
import { HasAccessGuard } from "src/guards/access.guard";
import { Request } from "express";
import { CashBankService } from "./cash-bank.service";

@Controller("cash-bank")
export class CashBankController {
  constructor(private service: CashBankService) {}

  @Get("/:complexId")
  @AccessLevel([1, 2, 3, 4, 7, 8, 9])
  @UseGuards(HasAccessGuard)
  async findBranchRanges(@Param("complexId") complexId: string) {
    return await this.service.findByComplex(complexId);
  }

  @Post("/:complexId")
  @AccessLevel([1, 2, 3, 4])
  @UseGuards(HasAccessGuard)
  async create(
    @Body() body: CreateCashBankDto,
    @Param("complexId") complexId: string,
    @Req() req: Request
  ) {
    const theUser = req.currentUser;
    return await this.service.create({
      ...body,
      complex_id: complexId,
      author_id: theUser._id.toString(),
    });
  }

  @Put("/close/:complexId/:id")
  @AccessLevel([1, 2, 3, 4])
  @UseGuards(HasAccessGuard)
  async closeCashBank(
    @Param("id") recordId: string,
    @Param("complexId") complexId: string,
    @Req() req: Request
  ) {
    const theUser = req.currentUser;
    return await this.service.closeCashBank({
      complex_id: complexId,
      author_id: theUser._id.toString(),
      id: recordId,
    });
  }

  @Put("/:complexId/:id")
  @AccessLevel([1, 2, 3, 4])
  @UseGuards(HasAccessGuard)
  async editName(
    @Body() body: CreateCashBankDto,
    @Param("id") recordId: string,
    @Param("complexId") complexId: string,
    @Req() req: Request
  ) {
    const theUser = req.currentUser;
    return await this.service.editName({
      ...body,
      complex_id: complexId,
      author_id: theUser._id.toString(),
      id: recordId,
    });
  }

  @Delete("/:complexId/:id")
  @AccessLevel([1, 2, 3, 4])
  @UseGuards(HasAccessGuard)
  async deleteRecord(
    @Req() req: Request,
    @Param("id") recordId: string,
    @Param("complexId") complexId: string
  ) {
    const theUser = req.currentUser;
    await this.service.deleteOne({
      id: recordId,
      complex_id: complexId,
      author_id: theUser._id.toString(),
    });
    return "success";
  }
}
