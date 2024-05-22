import { ShippingRangeService } from "./shipping-range.service";
import {
  BadRequestException,
  Controller,
  Get,
  Put,
  Query,
} from "@nestjs/common";

@Controller("shipping-range")
export class ShippingRangeController {
  constructor(private service: ShippingRangeService) {}

  @Get()
  async findAll() {
    return await this.service.findAll();
  }

  @Get("/:complexId")
  async findByComplex() {
    return await this.service.findAll();
  }

  @Get("/:complexId/price")
  async shippingPriceCalculator(
    @Query() queryParams: { [props: string]: string }
  ) {
    const { lat, lng } = queryParams;
    if (!Number(lat) || !Number(lng)) throw new BadRequestException();
    const theRange = await this.service.findCorrespondingRange([
      Number(lat),
      Number(lng),
    ]);
    return typeof theRange?.price === "number"
      ? theRange.price || 0
      : "not in range";
  }

  @Put()
  async updateData() {
    return await this.service.updateData();
  }
}
