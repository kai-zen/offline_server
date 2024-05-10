import { AccessLevel } from "src/helpers/decorators";
import { CreateOrderDto } from "./dto/create.dto";
import { EditOrderDto } from "./dto/edit.dto";
import { HasAccessGuard } from "src/guards/access.guard";
import { IsAdminGuard } from "src/guards/admin.guard";
import { IsLoggedInGuard } from "src/guards/auth.guard";
import { OrderActionService } from "./service/order-action.service";
import { OrderFetchService } from "./service/order-fetch.service";
import { Request } from "express";
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { OrderCreateService } from "./service/order-create.service";
import { messages } from "src/helpers/constants";
import { AddItemToOrderDto } from "./dto/add.dto";
import { EditAddressDto } from "./dto/edit-address.dto";
import { EditPriceDto } from "./dto/edit-price.dto";
import { EditDeliveryDto } from "./dto/edit-delivery.dto";
import { LoadOfflineOrdersDto } from "./dto/offline.dto";
import { RemoveItemFromOrderDto } from "./dto/remove-item.dto";
import { OrderStatsService } from "./service/order-stats.service";

@Controller("orders")
@UseGuards(IsLoggedInGuard)
export class OrderController {
  constructor(
    private actionService: OrderActionService,
    private fetchService: OrderFetchService,
    private createService: OrderCreateService,
    private readonly statsService: OrderStatsService
  ) {}

  @Get()
  @UseGuards(IsAdminGuard)
  async findAll(@Query() queryParams: { [props: string]: string }) {
    return await this.fetchService.findAll(queryParams);
  }

  @Get("/user")
  @UseGuards(IsLoggedInGuard)
  async findUserOrders(@Query() queryParams: { [props: string]: string }) {
    return await this.fetchService.findUserOrders(queryParams);
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
  @AccessLevel([1, 2, 3, 4])
  @UseGuards(HasAccessGuard)
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
  @AccessLevel([1, 2])
  @UseGuards(HasAccessGuard)
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
  @AccessLevel([1, 2])
  @UseGuards(HasAccessGuard)
  async getTodayStats(@Param("complexId") complexId: string) {
    return await this.statsService.todayStats(complexId);
  }

  @Get("/complex/:complexId/quantity/past-days/:day")
  @AccessLevel([1, 2])
  @UseGuards(HasAccessGuard)
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
  @AccessLevel([1, 2])
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

  @Get("/:complexId/:id")
  @AccessLevel([1, 2])
  @UseGuards(HasAccessGuard)
  async findById(@Param("id") recordId: string) {
    return await this.fetchService.findById(recordId);
  }

  @Post()
  @UseGuards(IsLoggedInGuard)
  async createOrder(@Body() body: CreateOrderDto, @Req() req: Request) {
    const { is_platform, ...restOfBody } = body;
    return await this.createService.create(
      req.currentUser,
      restOfBody,
      is_platform
    );
  }

  // this route is for create order by complex employee
  @Post("/employee")
  @AccessLevel([1, 2, 4, 5, 7, 8])
  @UseGuards(HasAccessGuard)
  async createOrderByEmployee(@Body() body: CreateOrderDto) {
    return await this.createService.createByEmployee(body);
  }

  @Post("/offline")
  @AccessLevel([1, 2, 4])
  @UseGuards(HasAccessGuard)
  async loadOfllineOrders(@Body() body: LoadOfflineOrdersDto) {
    return await this.createService.loadOfflineOrders(body);
  }

  @Put("/employee/add/:id")
  @AccessLevel([1, 2, 4, 5, 7, 8])
  @UseGuards(HasAccessGuard)
  async addItemsToOrderByEmployee(
    @Param("id") recordId: string,
    @Body() body: AddItemToOrderDto
  ) {
    return await this.createService.addItemsToExistingOrder({
      ...body,
      order_id: recordId,
    });
  }

  @Put("/edit-address/:id")
  @AccessLevel([1, 2, 4])
  @UseGuards(HasAccessGuard)
  async editAddress(
    @Param("id") recordId: string,
    @Body() body: EditAddressDto
  ) {
    return await this.actionService.editAddress({
      ...body,
      order_id: recordId,
    });
  }

  @Put("/edit-delivery/:id")
  @AccessLevel([1, 2, 4, 7])
  async editDelivery(
    @Param("id") recordId: string,
    @Body() body: EditDeliveryDto
  ) {
    return await this.actionService.editDeliveryGuy({
      order_id: recordId,
      ...body,
    });
  }

  @Put("/edit-prices/:id")
  @AccessLevel([1, 2, 4])
  @UseGuards(HasAccessGuard)
  async editPrices(
    @Param("id") recordId: string,
    @Body() body: EditPriceDto,
    @Req() req: Request
  ) {
    const theEmployee = req.currentUser;
    return await this.actionService.editPrices({
      new_values: body,
      author_id: theEmployee._id.toString(),
      order_id: recordId,
    });
  }

  @Put("/remove-item/:id")
  @AccessLevel([1, 2, 4])
  async removeItem(
    @Param("id") recordId: string,
    @Body() body: RemoveItemFromOrderDto
  ) {
    return await this.createService.removeItemFromExistingOrder({
      ...body,
      order_id: recordId,
    });
  }

  @Put("/cancel/:id")
  @UseGuards(IsLoggedInGuard)
  async cancelOrder(@Param("id") recordId: string, @Req() req: Request) {
    return await this.actionService.cancelOrder(recordId, req.currentUser._id);
  }

  @Put("/:complexId/:id")
  @AccessLevel([1, 2, 3, 4, 5, 6, 7, 8, 9])
  @UseGuards(HasAccessGuard)
  async editOrder(
    @Req() req: Request,
    @Param("id") recordId: string,
    @Body() body: EditOrderDto
  ) {
    const theEmployee = req.currentUser;
    return await this.actionService.findAndEdit({
      id: recordId,
      body,
      author_id: theEmployee._id.toString(),
    });
  }
}
