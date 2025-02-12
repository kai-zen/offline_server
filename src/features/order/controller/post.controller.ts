import { AccessLevel } from "src/helpers/decorators";
import { HasAccessGuard } from "src/guards/access.guard";
import { Body, Controller, Post, UseGuards } from "@nestjs/common";
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
    await this.orderOtherCreateService.uploadOrders();
  }

  // this route is for create order by complex employee
  @Post("/employee") // *
  @AccessLevel([1, 2, 3, 4, 5, 7, 8])
  @UseGuards(HasAccessGuard)
  async createOrderByEmployee(@Body() body: CreateOrderDto) {
    return await this.createService.createByEmployee(body);
  }

  @Post("/print/:complexId") // *
  async printReceipt(@Body() body: any) {
    return await this.actionService.printReceipt(body);
  }
}
