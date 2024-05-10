import { IsOwnerGuard } from "src/guards/owner.guard";
import { AccessService } from "./access.service";
import { CreateAccessDto } from "./dto/create.dto";
import { EditAccessDto } from "./dto/edit.dto";
import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { HasAccessGuard } from "src/guards/access.guard";
import { AccessLevel } from "src/helpers/decorators";

@Controller("access")
export class AccessController {
  constructor(private service: AccessService) {}

  @Get("/:complexId")
  @AccessLevel([1, 2, 3, 4, 5, 6, 7, 8, 9])
  @UseGuards(HasAccessGuard)
  async findAll(
    @Query() queryParams: { [props: string]: string },
    @Param("complexId") complexId: string
  ) {
    const results = await this.service.findAll({
      ...queryParams,
      complex: complexId,
    });
    return results;
  }

  @Get("/:complexId/:id")
  @UseGuards(IsOwnerGuard)
  async findById(@Param("id") accessId: string) {
    return await this.service.findById(accessId);
  }

  @Post("/:complexId")
  @UseGuards(IsOwnerGuard)
  async create(
    @Param("complexId") complexId: string,
    @Body() body: CreateAccessDto
  ) {
    const { mobile, type } = body || {};
    if (type == 1)
      throw new BadRequestException("برای ویرایش مدیر به پشتیبانی تیکت بزنید.");
    const createdAccess = await this.service.create({
      mobile,
      type,
      complex: complexId,
    });
    return createdAccess;
  }

  @Put("/:complexId/:id")
  @UseGuards(IsOwnerGuard)
  async editItem(@Param("id") accessId: string, @Body() body: EditAccessDto) {
    const { type: newLevel } = body || {};
    if (newLevel == 1)
      throw new BadRequestException("برای ویرایش مدیر به پشتیبانی تیکت بزنید.");
    return await this.service.findAndEdit(accessId, newLevel);
  }

  @Delete("/:complexId/:id")
  @UseGuards(IsOwnerGuard)
  async deleteItem(@Param("id") accessId: string) {
    await this.service.deleteOne(accessId);
    return "success";
  }
}
