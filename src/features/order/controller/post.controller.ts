import { Body, Controller, Param, Post } from "@nestjs/common";
import { OrderCreateService } from "../service/C/by-emp.service";
import { OrderActionService } from "../service/U/actions.service";
import { CreateOrderDto } from "../dto/create.dto";
import { OrderOtherCreateService } from "../service/C/other.service";

@Controller("orders")
export class OrderPostController {
  constructor(
    private readonly actionService: OrderActionService,
    private readonly createService: OrderCreateService,
    private readonly orderOtherCreateService: OrderOtherCreateService
  ) {}

  @Post("/upload") // *
  async uploadOrders() {
    return await this.orderOtherCreateService.uploadOrders();
  }

  @Post("/upload/:orderId") // *
  async uploadSingleOrder(@Param("orderId") orderId: string) {
    return await this.orderOtherCreateService.uploadSingleOrder(orderId);
  }

  @Post("/employee") // *
  async createOrderByEmployee(@Body() body: CreateOrderDto) {
    return await this.createService.createByEmployee(body);
  }

  @Post("/print/:complexId") // *
  async printReceipt(@Body() body: any) {
    return await this.actionService.printReceipt(body);
  }
}
