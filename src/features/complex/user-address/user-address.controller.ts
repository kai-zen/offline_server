import { ComplexUserAddressService } from "./user-address.service";
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AccessLevel } from "src/helpers/decorators";
import { HasAccessGuard } from "src/guards/access.guard";
import { CreateComplexUserAddressDto } from "./dto/create.dto";

@Controller("complex-user-address")
export class ComplexUserAddressController {
  constructor(private service: ComplexUserAddressService) {}

  @Get("/complex/:complexId") // *
  async findAll(@Query() queryParams: { [props: string]: string }) {
    return await this.service.findAll(queryParams);
  }

  @Get("/mobile/:complexId/:mobileNumber") // *
  async findUserRecordsWithMobile(@Param("mobileNumber") mobileNumber: string) {
    return await this.service.findByMobile(mobileNumber);
  }

  @Get("/:id")
  async findById(@Param("id") recordId: string) {
    return await this.service.findById(recordId);
  }

  @Post() // *
  @AccessLevel([1, 2, 3, 4])
  @UseGuards(HasAccessGuard)
  async create(@Body() body: CreateComplexUserAddressDto) {
    return await this.service.create(body);
  }

  @Put() // *
  async updateData() {
    return await this.service.updateData();
  }

  @Put("/:id") // *
  @AccessLevel([1, 2, 3, 4])
  @UseGuards(HasAccessGuard)
  async editItem(
    @Param("id") recordId: string,
    @Body() body: CreateComplexUserAddressDto
  ) {
    return await this.service.findAndEdit(recordId, body);
  }

  @Delete("/:complexId/:id") // *
  @AccessLevel([1, 2, 3, 4])
  @UseGuards(HasAccessGuard)
  async deleteItem(@Param("id") recordId: string) {
    return await this.service.deleteOne(recordId);
  }
}
