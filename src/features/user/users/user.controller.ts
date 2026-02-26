import { UserService } from "./user.service";
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
} from "@nestjs/common";
import { SetNameDto, CheckPasswordDTO } from "./dto/set-name.dto";
import { Request } from "express";
import { messages } from "src/helpers/constants";

export const local_server_version = "5.0.0";
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
      local_server_version,
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

  @Post("/check-password")
  async checkPassword(@Req() req: Request, @Body() body: CheckPasswordDTO) {
    const userId = req?.currentUser?._id;
    if (!userId) throw new ForbiddenException(messages[403]);
    return await this.service.validatePassword(body);
  }

  @Put("/user")
  async updateData() {
    return await this.service.updateData();
  }

  @Put("/complex-users/set-name") // *
  async setNameAndGender(@Body() body: SetNameDto) {
    return await this.service.setName({ ...body, user_id: body.id });
  }

  @Put("/complex-users") // *
  async updateData2() {
    return await this.service.updateData();
  }
}
