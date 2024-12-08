import { AccessLevel } from "src/helpers/decorators";
import { HasAccessGuard } from "src/guards/access.guard";
import { Body, Controller, Param, Put, UseGuards } from "@nestjs/common";
import { OrderActionService } from "../service/U/actions.service";
import { ModifyOrderItemsDto } from "../dto/modify.dto";
import { OrderEditItemsService } from "../service/U/items.service";
import { EditAddressDto } from "../dto/edit-address.dto";
import { EditDeliveryDto } from "../dto/edit-delivery.dto";
import { EditPriceDto } from "../dto/edit-price.dto";
import { EditOrderDto, EditOrderPaymentsDto } from "../dto/edit.dto";
import { OrderEditPaymentAndStatusService } from "../service/U/pay-and-status.service";
import { ChangeOrderUserDto } from "../dto/modify-user.dto";

@Controller("orders")
export class OrderPutController {
  constructor(
    private readonly actionService: OrderActionService,
    private readonly editPayAndStatusService: OrderEditPaymentAndStatusService,
    private readonly editItemsService: OrderEditItemsService
  ) {}

  @Put("/employee/modify")
  @AccessLevel([1, 2, 3, 4])
  @UseGuards(HasAccessGuard)
  async modifyItems(@Body() body: ModifyOrderItemsDto) {
    return await this.editItemsService.modifyItems(body);
  }

  @Put("/employee/modify-user")
  @AccessLevel([1, 2, 3, 4])
  @UseGuards(HasAccessGuard)
  async modifyUserOrder(@Body() body: ChangeOrderUserDto) {
    return await this.actionService.modifyUser(body);
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
  @AccessLevel([1, 2, 3, 4, 7])
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
  @AccessLevel([1, 2, 3, 4])
  @UseGuards(HasAccessGuard)
  async editPrices(@Param("id") recordId: string, @Body() body: EditPriceDto) {
    return await this.actionService.editPrices({
      new_values: body,
      order_id: recordId,
    });
  }

  @Put("/toggle-on-hold/:id")
  @AccessLevel([1, 2, 3, 4])
  @UseGuards(HasAccessGuard)
  async toggleOnHold(@Param("id") recordId: string) {
    return await this.actionService.toggleOnHold(recordId);
  }

  @Put("/:complexId/:id")
  @AccessLevel([1, 2, 3, 4, 5, 6, 7, 8, 9])
  @UseGuards(HasAccessGuard)
  async editOrder(@Param("id") recordId: string, @Body() body: EditOrderDto) {
    return await this.editPayAndStatusService.changeOrderStatus({
      id: recordId,
      body,
    });
  }

  @Put("/payment/:complexId/:id")
  @AccessLevel([1, 2, 3, 4, 5, 6, 7, 8, 9])
  @UseGuards(HasAccessGuard)
  async editOrderPayments(
    @Param("id") recordId: string,
    @Body() body: EditOrderPaymentsDto
  ) {
    return await this.editPayAndStatusService.editPayment({
      id: recordId,
      body,
    });
  }
}
