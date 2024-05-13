import { ComplexUsersService } from "./complex-user.service";
import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { IsLoggedInGuard } from "src/guards/auth.guard";

@Controller("complex-users")
export class ComplexUsersController {
  constructor(private readonly service: ComplexUsersService) {}

  @Get("brief/:userId/:complexId")
  @UseGuards(IsLoggedInGuard)
  async findComplexUserBrief(
    @Param("complexId") complexId: string,
    @Param("userId") userId: string
  ) {
    return await this.service.findByUserAndComplexBrief(userId, complexId);
  }
}
