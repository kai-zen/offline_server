import { AccessService } from "./access.service";
import { Controller, Put, UseGuards } from "@nestjs/common";
import { HasAccessGuard } from "src/guards/access.guard";

@Controller("access")
export class AccessController {
  constructor(private service: AccessService) {}

  @Put()
  async updateData() {
    return await this.service.updateData();
  }
}
