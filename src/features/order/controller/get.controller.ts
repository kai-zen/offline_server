import { Controller, Get, Query } from "@nestjs/common";
import { OrderFetchService } from "../service/R/fetch.service";

@Controller("orders")
export class OrderGetController {
  constructor(private readonly fetchService: OrderFetchService) {}

  @Get()
  async findAll(@Query() queryParams: { [props: string]: string }) {
    return await this.fetchService.findAll(queryParams);
  }

  @Get("/complex/live/:complexId") // *
  async findComplexLiveOrders() {
    return await this.fetchService.findComplexLiveOrders();
  }
}
