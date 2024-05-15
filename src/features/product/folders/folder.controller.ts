import { Controller, Get, Put } from "@nestjs/common";
import { ProductFolderService } from "./folder.service";

@Controller("product-folder")
export class ProductFolderController {
  constructor(private service: ProductFolderService) {}

  @Get()
  async findAll() {
    return await this.service.findAll();
  }

  @Put()
  async updateData() {
    return await this.service.updateData();
  }
}
