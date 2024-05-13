import { UserService } from "./user.service";
import { Controller, Get, Param, Query } from "@nestjs/common";

@Controller("user")
export class UserController {
  constructor(private service: UserService) {}

  @Get()
  async findAll(@Query() queryParams: { [props: string]: string }) {
    return await this.service.findAll(queryParams);
  }

  @Get("/:id")
  async findById(@Param("id") complexId: string) {
    return await this.service.findById(complexId);
  }
}
