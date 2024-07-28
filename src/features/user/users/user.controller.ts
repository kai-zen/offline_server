import { AccessLevel } from "src/helpers/decorators";
import { UserService } from "./user.service";
import { Body, Controller, Get, Param, Put, Query } from "@nestjs/common";
import { SetNameDto } from "./dto/set-name.dto";

@Controller()
export class UserController {
  constructor(private service: UserService) {}

  @Get("/user")
  async findAll(@Query() queryParams: { [props: string]: string }) {
    return await this.service.findAll(queryParams);
  }

  @Get("/complex-users")
  async findAll2(@Query() queryParams: { [props: string]: string }) {
    return await this.service.findAll(queryParams);
  }

  @Get("/user/is-running") isServerRunning() {
    return {
      is_connected: true,
      version: 1,
      installed: 1,
    };
  }

  @Get("/complex-users/is-running") isServerRunning2() {
    return {
      is_connected: true,
    };
  }

  @Get("/user/:complexId")
  async findAllByComplex(@Query() queryParams: { [props: string]: string }) {
    return await this.service.findAll(queryParams);
  }

  @Get("/complex-users/:complexId")
  async findAllByComplex2(@Query() queryParams: { [props: string]: string }) {
    return await this.service.findAll(queryParams);
  }

  @Get("/user/:id")
  async findById(@Param("id") complexId: string) {
    return await this.service.findById(complexId);
  }

  @Get("/complex-users/:id")
  async findById2(@Param("id") complexId: string) {
    return await this.service.findById(complexId);
  }

  @Put("/user")
  async updateData() {
    return await this.service.updateData();
  }

  @Put("/complex-users/set-name")
  @AccessLevel([1, 2, 3, 4, 5])
  async setName(@Body() body: SetNameDto) {
    return await this.service.setName(body);
  }

  @Put("/complex-users")
  async updateData2() {
    return await this.service.updateData();
  }
}
