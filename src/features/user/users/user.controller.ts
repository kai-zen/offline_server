import { UserService } from "./user.service";
import { Controller, Get, Param, Put, Query } from "@nestjs/common";

@Controller()
export class UserController {
  constructor(private service: UserService) {}

  @Get("/user")
  async findAll(@Query() queryParams: { [props: string]: string }) {
    return await this.service.findAll(queryParams);
  }

  @Get("/complex-user")
  async findAll2(@Query() queryParams: { [props: string]: string }) {
    return await this.service.findAll(queryParams);
  }

  @Get("/user/is-running") isServerRunning() {
    return {
      is_connected: true,
    };
  }

  @Get("/complex-user/is-running") isServerRunning2() {
    return {
      is_connected: true,
    };
  }

  @Get("/user/:complexId")
  async findAllByComplex(@Query() queryParams: { [props: string]: string }) {
    return await this.service.findAll(queryParams);
  }

  @Get("/complex-user/:complexId")
  async findAllByComplex2(@Query() queryParams: { [props: string]: string }) {
    return await this.service.findAll(queryParams);
  }

  @Get("/user/:id")
  async findById(@Param("id") complexId: string) {
    return await this.service.findById(complexId);
  }

  @Get("/complex-user/:id")
  async findById2(@Param("id") complexId: string) {
    return await this.service.findById(complexId);
  }

  @Put("/user")
  async updateData() {
    return await this.service.updateData();
  }

  @Put("/complex-user")
  async updateData2() {
    return await this.service.updateData();
  }
}
