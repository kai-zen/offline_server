import { AccessLevel } from "src/helpers/decorators";
import { UserService } from "./user.service";
import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { SetNameDto } from "./dto/set-name.dto";
import { HasAccessGuard } from "src/guards/access.guard";

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

  @Get("/user/is-running")
  isServerRunning() {
    return {
      is_connected: true,
      local_server_version: 2,
    };
  }

  @Get("/complex-users/:complexId") // *
  async findAllByComplex2(@Query() queryParams: { [props: string]: string }) {
    return await this.service.findAll(queryParams);
  }

  @Get("/user/:id") // *
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

  @Put("/complex-users/set-name") // *
  @AccessLevel([1, 2, 3, 4, 5])
  @UseGuards(HasAccessGuard)
  async setNameAndGender(@Body() body: SetNameDto) {
    return await this.service.setName(body);
  }

  @Put("/complex-users") // *
  async updateData2() {
    return await this.service.updateData();
  }
}
