import { ProductService } from "./product.service";
import { Controller, Get, Put } from "@nestjs/common";

@Controller("product")
export class ProductController {
  constructor(private readonly service: ProductService) {}

  @Get()
  async findAll() {
    return await this.service.findAll();
  }

  @Get("/complex/:complexId") // *
  async findComplexProducts() {
    return await this.service.findComplexProducts();
  }

  @Put()
  async updateData() {
    return await this.service.updateData();
  }
}
