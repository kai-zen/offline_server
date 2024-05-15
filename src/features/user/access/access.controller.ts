import { AccessService } from "./access.service";
import { Controller, Put } from "@nestjs/common";

@Controller("access")
export class AccessController {
  constructor(private service: AccessService) {}

  @Put()
  async updateData() {
    return await this.service.updateData();
  }
}
