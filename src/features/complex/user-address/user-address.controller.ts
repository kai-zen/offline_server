import { IsLoggedInGuard } from "src/guards/auth.guard";
import { ComplexUserAddressService } from "./user-address.service";
import { Controller, Get, Param, UseGuards } from "@nestjs/common";

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
}
