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
import { PrinterService } from "./printer.service";
import { AccessLevel } from "src/helpers/decorators";
import { HasAccessGuard } from "src/guards/access.guard";
import { CreatePrinterDto } from "./dto/create.dto";

@Controller("printer")
export class PrinterController {
  constructor(private service: PrinterService) {}

  @Get()
  async findAll() {
    return await this.service.findAll();
  }

  @Get("/:complexId") // *
  async findByComplex() {
    return await this.service.findAll();
  }

  @Post("/:complexId") // *
  @AccessLevel([1, 2, 3, 4])
  @UseGuards(HasAccessGuard)
  async create(
    @Body() body: CreatePrinterDto,
    @Param("complexId") complexId: string
  ) {
    return await this.service.create(complexId, body);
  }

  @Put()
  async updateData() {
    return await this.service.updateData();
  }

  @Put("/:complexId/:id") // *
  @AccessLevel([1, 2, 3, 4])
  @UseGuards(HasAccessGuard)
  async editName(
    @Body() body: CreatePrinterDto,
    @Param("id") recordId: string,
    @Param("complexId") complexId: string
  ) {
    return await this.service.edit({
      id: recordId,
      complex_id: complexId,
      body,
    });
  }

  @Delete("/:complexId/:id") // *
  @AccessLevel([1, 2, 3, 4])
  @UseGuards(HasAccessGuard)
  async deleteRecord(@Param("id") recordId: string) {
    await this.service.deleteOne(recordId);
    return "success";
  }
}
