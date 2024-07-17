import { AccessLevel } from "src/helpers/decorators";
import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { HasAccessGuard } from "src/guards/access.guard";
import { ShiftService } from "./shift.service";

@Controller("shift")
export class ShiftController {
  constructor(private service: ShiftService) {}

  @Get("/:complexId")
  @AccessLevel([1, 2, 3, 4])
  @UseGuards(HasAccessGuard)
  async findComplexShifts(
    @Param("complexId") complexId: string,
    @Query() queryParams: { [props: string]: string }
  ) {
    return await this.service.findByComplex(complexId, queryParams);
  }

  @Get("/delivery-guys/:complexId/:shiftId")
  @AccessLevel([1, 2, 3, 4])
  @UseGuards(HasAccessGuard)
  async findShiftDeliveryGuysReport(@Param("shiftId") shiftId: string) {
    return await this.service.findShiftDeliveryGuysReports(shiftId);
  }

  @Get("/:complexId/:shiftId")
  @AccessLevel([1, 2, 3, 4])
  @UseGuards(HasAccessGuard)
  async findShiftOrders(
    @Param("shiftId") shiftId: string,
    @Query() queryParams: { [props: string]: string }
  ) {
    return await this.service.findShiftOrders(shiftId, queryParams);
  }
}
