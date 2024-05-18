import { IsLoggedInGuard } from "src/guards/auth.guard";
import { ComplexUserAddressService } from "./user-address.service";
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { AccessLevel } from "src/helpers/decorators";
import { HasAccessGuard } from "src/guards/access.guard";
import { CreateComplexUserAddressDto } from "./dto/create.dto";

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
  async findUserRecordsWithMobile(
    @Param("mobileNumber") mobileNumber: string,
    @Param("complexId") complexId: string
  ) {
    return await this.service.findByMobile(mobileNumber, complexId);
  }

  @Put("/:id")
  @AccessLevel([1, 2, 4, 5, 7])
  @UseGuards(HasAccessGuard)
  async editItem(
    @Param("id") recordId: string,
    @Body() body: CreateComplexUserAddressDto
  ) {
    return await this.service.findAndEdit(recordId, body);
  }

  @Delete("/:complexId/:id")
  @AccessLevel([1, 2, 4, 5, 7])
  @UseGuards(HasAccessGuard)
  async deleteItem(@Param("id") recordId: string) {
    return await this.service.deleteOne(recordId);
  }

  @Post()
  @AccessLevel([1, 2, 4, 5, 7])
  @UseGuards(HasAccessGuard)
  async create(@Body() body: CreateComplexUserAddressDto) {
    return await this.service.create(body);
  }

  @Put()
  async updateData() {
    return await this.service.updateData();
  }
}
