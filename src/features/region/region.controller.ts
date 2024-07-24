import {
  BadRequestException,
  Controller,
  Get,
  Put,
  Query,
} from "@nestjs/common";
import { RegionService } from "./region.service";

@Controller("region")
export class RegionController {
  constructor(private service: RegionService) {}

  @Get("/by-coords")
  async findByCoords(@Query() queryParams: { [props: string]: string }) {
    const { lat, lng } = queryParams;
    if (!lat || !lng) throw new BadRequestException("مختصات تعیین نشده است.");
    if (isNaN(Number(lat)) || isNaN(Number(lng)))
      throw new BadRequestException("مختصات وارد شده نامعتبر است.");
    return await this.service.findRegionByCoordinates({
      lat: Number(lat),
      lng: Number(lng),
    });
  }

  @Get("/:cityId")
  async findByCity() {
    return await this.service.findAll();
  }

  @Put()
  async updateDB() {
    return await this.service.updateDB();
  }
}
