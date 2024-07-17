import { AccessLevel } from "src/helpers/decorators";
import { HasAccessGuard } from "src/guards/access.guard";
import { IsLoggedInGuard } from "src/guards/auth.guard";
import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { messages } from "src/helpers/constants";
import { OrderFetchService } from "../service/R/fetch.service";
import { OrderStatsService } from "../service/R/stats.service";

@Controller("orders")
export class OrderGetController {
  constructor(
    private readonly fetchService: OrderFetchService,
    private readonly statsService: OrderStatsService
  ) {}

  @Get()
  async findAll(@Query() queryParams: { [props: string]: string }) {
    return await this.fetchService.findAll(queryParams);
  }

  @Get("/user")
  @UseGuards(IsLoggedInGuard)
  async findUserOrders(@Query() queryParams: { [props: string]: string }) {
    return await this.fetchService.findUserOrders(queryParams);
  }

  @Get("/last-added/:complexId")
  async lastAddedOrder(@Param("complexId") complexId: string) {
    return await this.fetchService.lastAddedOrder(complexId);
  }

  @Get("/user/complex/:complexId")
  @UseGuards(IsLoggedInGuard)
  async findUserComplexOrders(
    @Query() queryParams: { [props: string]: string },
    @Param("complexId") complexId: string
  ) {
    return await this.fetchService.findUserOrders(queryParams, complexId);
  }

  @Get("/complex/live/:complexId")
  @AccessLevel([1, 2, 3, 4, 5, 6, 7, 8, 9])
  @UseGuards(HasAccessGuard)
  async findComplexLiveOrders(@Param("complexId") complexId: string) {
    return await this.fetchService.findComplexLiveOrders(complexId);
  }

  @Get("/complex/cash-bank/:complexId/:cashbankId")
  async findCashbankOrders(
    @Query() queryParams: { [props: string]: string },
    @Param("complexId") complexId: string,
    @Param("cashbankId") cashbankId: string
  ) {
    return await this.fetchService.findCashbankOrders(
      complexId,
      cashbankId,
      queryParams
    );
  }

  @Get("/complex/:complexId")
  async findComplexOrders(
    @Query() queryParams: { [props: string]: string },
    @Param("complexId") complexId: string
  ) {
    const theRecord = await this.fetchService.findComplexOrders(
      complexId,
      queryParams
    );
    return theRecord;
  }

  @Get("/complex/:complexId/stats/today")
  async getTodayStats(@Param("complexId") complexId: string) {
    return await this.statsService.todayStats(complexId);
  }

  @Get("/complex/:complexId/quantity/past-days/:day")
  async getPastDaysQuantities(
    @Param("complexId") complexId: string,
    @Param("day") day: string
  ) {
    return await this.statsService.pastDaysQuantity(
      complexId,
      Number(day) || 7
    );
  }

  @Get("/complex/:complexId/stats/past-days/:day")
  @AccessLevel([1, 2, 3])
  @UseGuards(HasAccessGuard)
  async getPastDaysStats(
    @Param("complexId") complexId: string,
    @Param("day") day: string
  ) {
    return await this.statsService.pastDaysStats(complexId, Number(day) || 7);
  }

  @Get("/complex/:complexId/stats/finance")
  @AccessLevel([1, 2, 3, 4])
  @UseGuards(HasAccessGuard)
  async financeStats(
    @Param("complexId") complexId: string,
    @Query() queryParams: { [props: string]: string }
  ) {
    const { start, end, cash_bank } = queryParams;
    if (!start) throw new BadRequestException(messages[400]);
    return await this.statsService.financeReport({
      complex_id: complexId,
      end,
      start,
      cash_bank,
    });
  }

  @Get("/complex/orders-count/:complexId")
  async todayCount(@Param("complexId") complexId: string) {
    return await this.fetchService.todayCount(complexId);
  }

  @Get("/details/:complexId/:id")
  async findById(
    @Param("id") recordId: string,
    @Param("complexId") complexId: string
  ) {
    return await this.fetchService.findDetails(recordId, complexId);
  }
}
