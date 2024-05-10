import { CreateDiscountDto } from "./dto/create.dto";
import { DiscountService } from "./discount.service";
import { EditDiscountDto } from "./dto/edit.dto";
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AccessLevel } from "src/helpers/decorators";
import { HasAccessGuard } from "src/guards/access.guard";
import { Request } from "express";

@Controller("discount")
export class DiscountController {
  constructor(private service: DiscountService) {}

  @Get("/:complexId")
  async findAll(
    @Query() queryParams: { [props: string]: string },
    @Param("complexId") complexId: string
  ) {
    return await this.service.findAll(complexId, queryParams);
  }

  @Get("/:complexId/:id")
  async findById(@Param("id") complexId: string) {
    return await this.service.findById(complexId);
  }

  @Post("/:complexId")
  @AccessLevel([1, 2])
  @UseGuards(HasAccessGuard)
  async create(
    @Body() body: CreateDiscountDto,
    @Param("complexId") complexId: string,
    @Req() req: Request
  ) {
    const theUser = req.currentUser;
    return await this.service.create({
      ...body,
      complex: complexId,
      author_id: theUser._id.toString(),
    });
  }

  @Put("/:complexId/:id")
  @AccessLevel([1, 2])
  @UseGuards(HasAccessGuard)
  async editItem(
    @Param("id") recordId: string,
    @Body() body: EditDiscountDto,
    @Req() req: Request
  ) {
    const theUser = req.currentUser;
    return await this.service.findAndEdit({
      id: recordId,
      body,
      author_id: theUser._id.toString(),
    });
  }

  @Put("/:complexId/toggle/:id")
  @AccessLevel([1, 2])
  @UseGuards(HasAccessGuard)
  async toggleActivation(@Param("id") recordId: string, @Req() req: Request) {
    const theUser = req.currentUser;
    return await this.service.toggleActivation({
      id: recordId,
      author_id: theUser._id.toString(),
    });
  }

  @Delete("/:complexId/:id")
  @AccessLevel([1, 2])
  @UseGuards(HasAccessGuard)
  async deleteItem(@Param("id") recordId: string, @Req() req: Request) {
    const theUser = req.currentUser;
    return await this.service.deleteOne({
      id: recordId,
      author_id: theUser._id.toString(),
    });
  }
}
