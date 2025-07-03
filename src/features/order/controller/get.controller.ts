import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { OrderFetchService } from "../service/R/fetch.service";
import { AccessLevel } from "src/helpers/decorators";
import { HasAccessGuard } from "src/guards/access.guard";
import { messages } from "src/helpers/constants";

@Controller("orders")
export class OrderGetController {
  constructor(private readonly fetchService: OrderFetchService) {}

  @Get()
  async findAll(@Query() queryParams: { [props: string]: string }) {
    return await this.fetchService.findAll(queryParams);
  }

  @Get("/complex/cash-bank/:complexId/:cashbankId")
  @AccessLevel([1, 2, 3, 4])
  @UseGuards(HasAccessGuard)
  async findCashbankOrders(
    @Param("complexId") complexId: string,
    @Param("cashbankId") cashbankId: string
  ) {
    return await this.fetchService.findCashbankOrders(complexId, cashbankId);
  }

  @Get("/complex/:complexId/stats/finance/with-count")
  @AccessLevel([1, 2, 3, 4])
  @UseGuards(HasAccessGuard)
  async financeStatsWithCount(
    @Param("complexId") complexId: string,
    @Query() queryParams: { [props: string]: string }
  ) {
    const { start, end, cash_bank } = queryParams;
    if (!start) throw new BadRequestException(messages[400]);
    const params = {
      complex_id: complexId,
      end,
      start,
      cash_bank,
    };
    const results = await this.fetchService.financeReport(params);
    const count = (await this.fetchService.orderCountReport(params)) || 0;
    return { results, count };
  }

  @Get("/complex/live/:complexId") // *
  async findComplexLiveOrders() {
    return await this.fetchService.findComplexLiveOrders();
  }
}
