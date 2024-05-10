import { IsLoggedInGuard } from "src/guards/auth.guard";
import { CreateComplexUserAddressDto } from "./dto/create.dto";
import { ComplexUserAddressService } from "./user-address.service";
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AccessLevel } from "src/helpers/decorators";
import { HasAccessGuard } from "src/guards/access.guard";
import { Request } from "express";

@Controller("complex-user-address")
export class ComplexUserAddressController {
  constructor(private service: ComplexUserAddressService) {}

  @Get("/with-price/:complexId/:userId")
  @UseGuards(IsLoggedInGuard)
  async findUserRecordsWithShippingPrice(
    @Param("complexId") complexId: string,
    @Param("userId") userId: string
  ) {
    return await this.service.findByUserWithShppingPrices(complexId, userId);
  }

  @Get("/mobile/:complexId/:mobileNumber")
  @AccessLevel([1, 2, 4, 5, 7])
  @UseGuards(HasAccessGuard)
  async findUserRecordsWithMobile(
    @Param("mobileNumber") mobileNumber: string,
    @Param("complexId") complexId: string
  ) {
    return await this.service.findByMobile(mobileNumber, complexId);
  }

  @Get("/:id")
  @AccessLevel([1, 2, 4, 5, 7])
  @UseGuards(HasAccessGuard)
  async findById(@Param("id") recordId: string) {
    return await this.service.findById(recordId);
  }

  @Post()
  @AccessLevel([1, 2, 4, 5, 7])
  @UseGuards(HasAccessGuard)
  async create(@Body() body: CreateComplexUserAddressDto) {
    return await this.service.create(body);
  }

  @Put("/:id")
  @AccessLevel([1, 2, 4, 5, 7])
  @UseGuards(HasAccessGuard)
  async editItem(
    @Param("id") recordId: string,
    @Body() body: CreateComplexUserAddressDto,
    @Req() req: Request
  ) {
    const theUser = req.currentUser;
    return await this.service.findAndEdit(
      recordId,
      body,
      theUser._id.toString()
    );
  }

  @Delete("/:complexId/:id")
  @AccessLevel([1, 2, 4, 5, 7])
  @UseGuards(HasAccessGuard)
  async deleteItem(
    @Param("id") recordId: string,
    @Param("complexId") complexId: string,
    @Req() req: Request
  ) {
    const theUser = req.currentUser;
    return await this.service.deleteOne(
      recordId,
      complexId,
      theUser._id.toString()
    );
  }
}
