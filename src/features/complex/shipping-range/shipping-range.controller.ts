import { AccessLevel } from "src/helpers/decorators";
import { CreateRangeDto } from "./dto/create.dto";
import { ShippingRangeService } from "./shipping-range.service";
import {
  BadRequestException,
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
import { HasAccessGuard } from "src/guards/access.guard";
import { IsLoggedInGuard } from "src/guards/auth.guard";
import { Request } from "express";

@Controller("shipping-range")
export class ShippingRangeController {
  constructor(private service: ShippingRangeService) {}

  @Get("/:complexId")
  @AccessLevel([1, 2, 10])
  @UseGuards(HasAccessGuard)
  async findByComplex(@Param("complexId") complexId: string) {
    return await this.service.findByComplex(complexId);
  }

  @Get("/:complexId/price")
  @UseGuards(IsLoggedInGuard)
  async shippingPriceCalculator(
    @Param("complexId") complexId: string,
    @Query() queryParams: { [props: string]: string }
  ) {
    const { lat, lng } = queryParams;
    if (!Number(lat) || !Number(lng)) throw new BadRequestException();
    const theRange = await this.service.findCorrespondingRange(
      [Number(lat), Number(lng)],
      complexId
    );
    return theRange?.price || "not in range";
  }

  @Get("/:complexId/:id")
  @AccessLevel([1, 2, 10])
  @UseGuards(HasAccessGuard)
  async findById(@Param("id") rangeId: string) {
    return await this.service.findById(rangeId);
  }

  @Post("/:complexId")
  @AccessLevel([1, 2, 10])
  @UseGuards(HasAccessGuard)
  async create(
    @Body() body: CreateRangeDto,
    @Req() req: Request,
    @Param("complexId") complexId: string
  ) {
    const theUser = req.currentUser;
    return await this.service.create({
      ...body,
      complex_id: complexId,
      author_id: theUser._id.toString(),
    });
  }

  @Put("/:complexId/:id")
  @AccessLevel([1, 2, 10])
  @UseGuards(HasAccessGuard)
  async editRecord(
    @Param("id") rangeId: string,
    @Body() body: CreateRangeDto,
    @Req() req: Request
  ) {
    const theUser = req.currentUser;
    return await this.service.findAndEdit({
      id: rangeId,
      body,
      author_id: theUser._id.toString(),
    });
  }

  @Put("/:complexId/toggle/:id")
  @AccessLevel([1, 2, 10])
  @UseGuards(HasAccessGuard)
  async toggleActivation(@Param("id") rangeId: string, @Req() req: Request) {
    const theUser = req.currentUser;
    return await this.service.toggleActivation({
      id: rangeId,
      author_id: theUser._id.toString(),
    });
  }

  @Delete("/:complexId/:id")
  @AccessLevel([1, 2, 10])
  @UseGuards(HasAccessGuard)
  async deleteRecord(@Param("id") rangeId: string, @Req() req: Request) {
    const theUser = req.currentUser;
    await this.service.deleteOne({
      id: rangeId,
      author_id: theUser._id.toString(),
    });
    return "success";
  }
}
