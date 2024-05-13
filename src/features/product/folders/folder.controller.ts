import { Controller, Get, Put, UseGuards } from "@nestjs/common";
import { ProductFolderService } from "./folder.service";
import { AccessLevel } from "src/helpers/decorators";
import { HasAccessGuard } from "src/guards/access.guard";

@Controller("product-folder")
export class ProductFolderController {
  constructor(private service: ProductFolderService) {}

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
