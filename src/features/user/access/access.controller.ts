import { AccessService } from "./access.service";
import { Controller, Get, Put, Query } from "@nestjs/common";

@Controller("access")
export class AccessController {
  constructor(private service: AccessService) {}

  @Get("/:complexId")
  async findAll(@Query() queryParams: { [props: string]: string }) {
    const results = await this.service.findAll({
      ...queryParams,
    });
    return results;
  }

  @Put()
  async updateData() {
    return await this.service.updateData();
  }
}
