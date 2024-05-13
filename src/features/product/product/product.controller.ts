import { AccessLevel } from "src/helpers/decorators";
import { HasAccessGuard } from "src/guards/access.guard";
import { ProductService } from "./product.service";
import { Controller, Get, Put, UseGuards } from "@nestjs/common";

@Controller("product")
export class ProductController {
  constructor(private readonly service: ProductService) {}

  @Get()
  async findAll() {
    return await this.service.findAll();
  }

  @Put()
  @AccessLevel([1, 2])
  @UseGuards(HasAccessGuard)
  async updateData() {
    return await this.service.updateData();
  }
}
