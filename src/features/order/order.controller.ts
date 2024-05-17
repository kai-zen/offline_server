import { CreateOrderDto } from "./dto/create.dto";
import { EditOrderDto } from "./dto/edit.dto";
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
import { RemoveItemFromOrderDto } from "./dto/remove-item.dto";
import { OrderStatsService } from "./service/order-stats.service";
import { HasAccessGuard } from "src/guards/access.guard";
import { AccessLevel } from "src/helpers/decorators";

@Controller("orders")
export class OrderController {
  constructor(
    private actionService: OrderActionService,
    private fetchService: OrderFetchService,
    private createService: OrderCreateService,
    private readonly statsService: OrderStatsService
  ) {}

  @Get("/complex/live/:complexId")
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

  @Get("/complex/:complexId/stats/finance")
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

  @Post("/upload")
  @AccessLevel([1, 2, 3, 4])
  @UseGuards(HasAccessGuard)
  async uploadOrders() {
    return await this.actionService.uploadOrders();
  }

  // this route is for create order by complex employee
  @Post("/employee")
  @AccessLevel([1, 2, 3, 4, 5, 6, 7, 8])
  @UseGuards(HasAccessGuard)
  async createOrderByEmployee(@Body() body: CreateOrderDto) {
    return await this.createService.createByEmployee(body);
  }

  @Put("/employee/add/:id")
  @AccessLevel([1, 2, 3, 4])
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
  @AccessLevel([1, 2, 3, 4])
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
  @AccessLevel([1, 2, 3, 4])
  @UseGuards(HasAccessGuard)
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
  async editPrices(@Param("id") recordId: string, @Body() body: EditPriceDto) {
    return await this.actionService.editPrices({
      new_values: body,
      order_id: recordId,
    });
  }

  @Put("/remove-item/:id")
  @AccessLevel([1, 2, 4])
  @UseGuards(HasAccessGuard)
  async removeItem(
    @Param("id") recordId: string,
    @Body() body: RemoveItemFromOrderDto
  ) {
    return await this.createService.removeItemFromExistingOrder({
      ...body,
      order_id: recordId,
    });
  }

  @Put("/:complexId/:id")
  @AccessLevel([1, 2, 3, 4])
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
