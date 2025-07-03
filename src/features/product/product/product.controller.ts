import { AccessLevel } from "src/helpers/decorators";
import { ProductService } from "./product.service";
import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { HasAccessGuard } from "src/guards/access.guard";
import { messages } from "src/helpers/constants";

@Controller("product")
export class ProductController {
  constructor(private readonly service: ProductService) {}

  @Get()
  async findAll() {
    return await this.service.findAll();
  }

  @Get("/complex/:complexId/stats")
  @AccessLevel([1, 2, 3, 4, 10])
  @UseGuards(HasAccessGuard)
  async getStats(
    @Param("complexId") complexId: string,
    @Query() queryParams: { [props: string]: string }
  ) {
    const { from } = queryParams;
    if (!from) throw new BadRequestException(messages[400]);
    return await this.service.pastDaysProductsStats({
      complex_id: complexId,
      params: queryParams,
    });
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
