import { AccessLevel } from "src/helpers/decorators";
import { ComplexUsersFetchService } from "./service/complex-user-fetch.service";
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Put,
  UseGuards,
} from "@nestjs/common";
import { HasAccessGuard } from "src/guards/access.guard";
import { IsLoggedInGuard } from "src/guards/auth.guard";
import { SendMessageDto } from "./dto/send-message.dto";
import { ComplexUsersActionsService } from "./service/complex-user-actions.service";
import { Request } from "express";
import { PayDebtDto } from "./dto/pay-debt.dto";

@Controller("complex-users")
export class ComplexUsersController {
  constructor(
    private readonly fetchService: ComplexUsersFetchService,
    private readonly actionsService: ComplexUsersActionsService
  ) {}

  @Get("/:complexId")
  @AccessLevel([1, 2])
  @UseGuards(HasAccessGuard)
  async findAll(
    @Param("complexId") complexId: string,
    @Query() queryParams: { [props: string]: string }
  ) {
    return await this.fetchService.fetchComplexUsers(complexId, queryParams);
  }

  @Get("/:userId/:complexId")
  @AccessLevel([1, 2])
  @UseGuards(HasAccessGuard)
  async findOne(
    @Param("complexId") complexId: string,
    @Param("userId") userId: string
  ) {
    return await this.fetchService.findByUserAndComplex(userId, complexId);
  }

  @Get("brief/:userId/:complexId")
  @UseGuards(IsLoggedInGuard)
  async findComplexUserBrief(
    @Param("complexId") complexId: string,
    @Param("userId") userId: string
  ) {
    return await this.fetchService.findByUserAndComplexBrief(userId, complexId);
  }

  @Post("/send-message/:complexId")
  @AccessLevel([1, 2])
  @UseGuards(HasAccessGuard)
  async sendMessage(
    @Param("complexId") complexId: string,
    @Body() body: SendMessageDto,
    @Req() req: Request
  ) {
    const theUser = req.currentUser;
    return await this.actionsService.sendMessage({
      complex_id: complexId,
      author_id: theUser._id.toString(),
      ...body,
    });
  }

  @Put("/pay-debt")
  @AccessLevel([1, 2])
  @UseGuards(HasAccessGuard)
  async payDebt(@Body() body: PayDebtDto, @Req() req: Request) {
    const theUser = req.currentUser;
    return await this.actionsService.payDebt({
      author_id: theUser._id.toString(),
      ...body,
    });
  }
}
