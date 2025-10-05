import { ComplexService } from "./comlex.service";
import { Controller, Get, Put, Body } from "@nestjs/common";
import { UpdateComplexDataDto } from "./dto/update-complex-data.dto";

@Controller("complex")
export class ComplexController {
  constructor(private readonly service: ComplexService) {}

  @Get("/last-local-updates") // *
  async findLastLocalUpdate() {
    return await this.service.getLastUpdates();
  }

  @Get("/:complexId") // *
  async find() {
    return await this.service.findTheComplex();
  }

  @Put() // *
  async updateData(@Body() updateComplexDataDto: UpdateComplexDataDto) {
    return await this.service.updateData(updateComplexDataDto);
  }
}
