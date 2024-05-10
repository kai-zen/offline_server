import { AccessLevel } from "src/helpers/decorators";
import { ComplexPutService } from "../service/complex-put.service";
import { EditComplexDto } from "../dto/edit.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { filepathToUrl } from "src/helpers/functions";
import { HasAccessGuard } from "src/guards/access.guard";
import { imageUploadConfig, imageValidator } from "src/helpers/constants";
import { IsAdminGuard } from "src/guards/admin.guard";
import { IsOwnerGuard } from "src/guards/owner.guard";
import { UpdateAddressDto } from "../dto/update-address.dto";
import { UpdateComplexMinOrderingPriceDto } from "../dto/min-ordering-price";
import { UpdateComplexPackingDto } from "../dto/packing.dto";
import { UpdateComplexPromotedProductsDto } from "../dto/promoted-products.dto";
import { UpdateComplexSettingsDto } from "../dto/settings.dto";
import { UpdateComplexTagsDto } from "../dto/tags.dto";
import { UpdateExpirationDateDto } from "../dto/expiration.dto";
import { UpdateGatewayDto } from "../dto/gateway.dto";
import { UpdateUsernameDto } from "../dto/username.dto";
import {
  Body,
  Controller,
  Param,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { UpdateEnamadDto } from "../dto/enamad.dto";
import { UpdateColorDto } from "../dto/color.dto";
import { UpdateDomainDto } from "../dto/domain.dto";
import { UpdateSmsDto } from "../dto/sms.dto";
import { Request } from "express";

@Controller("complex")
export class ComplexPutController {
  constructor(private readonly putService: ComplexPutService) {}

  @UseInterceptors(FileInterceptor("file", imageUploadConfig))
  @Put("/:complexId")
  @AccessLevel([1, 2, 10])
  @UseGuards(HasAccessGuard)
  async editItem(
    @Req() req: Request,
    @Param("complexId") recordId: string,
    @Body() body: EditComplexDto,
    @UploadedFile(imageValidator(false)) file?: Express.Multer.File
  ) {
    const { name, category, description, username } = body || {};
    const theUser = req.currentUser;
    return await this.putService.findAndEdit(recordId, {
      file: filepathToUrl(file?.path),
      name,
      category,
      description,
      username,
      author_id: theUser._id.toString(),
    });
  }

  @Put("/address/:complexId")
  @AccessLevel([1, 2, 10])
  @UseGuards(HasAccessGuard)
  async updateAddress(
    @Req() req: Request,
    @Param("complexId") complexId: string,
    @Body() body: UpdateAddressDto
  ) {
    const theUser = req.currentUser;
    return await this.putService.updateAddress({
      complex_id: complexId,
      body,
      author_id: theUser._id.toString(),
    });
  }

  @Put("/tax/:complexId/:tax")
  @AccessLevel([1, 2])
  @UseGuards(HasAccessGuard)
  async updateTax(
    @Req() req: Request,
    @Param("complexId") complexId: string,
    @Param("tax") tax: string
  ) {
    const theUser = req.currentUser;
    return await this.putService.setTax({
      complex_id: complexId,
      tax: Number(tax),
      author_id: theUser._id.toString(),
    });
  }

  @Put("/service/:complexId/:service")
  @AccessLevel([1, 2])
  @UseGuards(HasAccessGuard)
  async updateService(
    @Req() req: Request,
    @Param("complexId") complexId: string,
    @Param("service") service: string
  ) {
    const theUser = req.currentUser;
    return await this.putService.setService({
      complex_id: complexId,
      service: Number(service),
      author_id: theUser._id.toString(),
    });
  }

  @Put("/toggle/:complexId")
  @UseGuards(IsAdminGuard)
  async toggleActivation(@Param("complexId") recordId: string) {
    return await this.putService.toggleActivation(recordId);
  }

  @Put("/toggle-website/:complexId")
  @UseGuards(IsAdminGuard)
  async toggleIsWebsite(@Param("complexId") recordId: string) {
    return await this.putService.toggleIsWebsite(recordId);
  }

  @Put("/sms/:complexId")
  @UseGuards(IsAdminGuard)
  async changeSmsBudget(
    @Param("complexId") complexId: string,
    @Body() body: UpdateSmsDto
  ) {
    return await this.putService.chargeSms({
      complex_id: complexId,
      new_budget: body.budget,
    });
  }

  @Put("/gateway/:complexId")
  @UseGuards(IsOwnerGuard)
  async updateGateway(
    @Req() req: Request,
    @Body() body: UpdateGatewayDto,
    @Param("complexId") complexId: string
  ) {
    const theUser = req.currentUser;
    return await this.putService.updateGateway({
      ...body,
      complex_id: complexId,
      author_id: theUser._id.toString(),
    });
  }

  @Put("/enamad/:complexId")
  @UseGuards(IsOwnerGuard)
  async updateEnamad(
    @Req() req: Request,
    @Body() body: UpdateEnamadDto,
    @Param("complexId") complexId: string
  ) {
    const theUser = req.currentUser;
    return await this.putService.updateEnamad({
      ...body,
      complex_id: complexId,
      author_id: theUser._id.toString(),
    });
  }

  @Put("/color/:complexId")
  @UseGuards(IsOwnerGuard)
  async updateColor(
    @Req() req: Request,
    @Body() body: UpdateColorDto,
    @Param("complexId") complexId: string
  ) {
    const theUser = req.currentUser;
    return await this.putService.updateColor({
      ...body,
      complex_id: complexId,
      author_id: theUser._id.toString(),
    });
  }

  @Put("/domain/:complexId")
  @UseGuards(IsOwnerGuard)
  async updateDomain(
    @Req() req: Request,
    @Body() body: UpdateDomainDto,
    @Param("complexId") complexId: string
  ) {
    const theUser = req.currentUser;
    return await this.putService.updateDomain({
      ...body,
      complex_id: complexId,
      author_id: theUser._id.toString(),
    });
  }

  @Put("/settings/:complexId")
  @AccessLevel([1, 2, 10])
  @UseGuards(HasAccessGuard)
  async updateSettings(
    @Req() req: Request,
    @Body() body: UpdateComplexSettingsDto,
    @Param("complexId") complexId: string
  ) {
    const theUser = req.currentUser;
    return await this.putService.updateSettings({
      complex_id: complexId,
      settings: body,
      author_id: theUser._id.toString(),
    });
  }

  @Put("/admin/change-username/:id")
  @UseGuards(IsAdminGuard)
  async changeUsername(
    @Param("id") recordId: string,
    @Body() body: UpdateUsernameDto
  ) {
    return await this.putService.changeUsername(recordId, body.username);
  }

  @Put("/admin/change-owner/:complexId/:mobile")
  @UseGuards(IsAdminGuard)
  async changeOwner(
    @Param("complexId") complexId: string,
    @Param("mobile") mobile: string
  ) {
    return await this.putService.changeOwner({ complex_id: complexId, mobile });
  }

  @Put("/admin/change-expiration/:id")
  @UseGuards(IsAdminGuard)
  async changeExpiration(
    @Param("id") recordId: string,
    @Body() body: UpdateExpirationDateDto
  ) {
    return await this.putService.changeExpirationDate(
      recordId,
      body.expiration_date
    );
  }

  @Put("/packing/:complexId")
  @AccessLevel([1, 2])
  @UseGuards(HasAccessGuard)
  async updatePacking(
    @Req() req: Request,
    @Body() body: UpdateComplexPackingDto,
    @Param("complexId") complexId: string
  ) {
    const theUser = req.currentUser;
    return await this.putService.updatePacking({
      cost: body.packing_cost,
      complex_id: complexId,
      author_id: theUser._id.toString(),
    });
  }

  @Put("/tags/:complexId")
  @AccessLevel([1, 2, 10])
  @UseGuards(HasAccessGuard)
  async updateTags(
    @Req() req: Request,
    @Body() body: UpdateComplexTagsDto,
    @Param("complexId") complexId: string
  ) {
    const theUser = req.currentUser;
    return await this.putService.updateTags({
      tags: body.tags,
      complex_id: complexId,
      author_id: theUser._id.toString(),
    });
  }

  @Put("/min-ordering-price/:complexId")
  @AccessLevel([1, 2])
  @UseGuards(HasAccessGuard)
  async updateMinOrderingPrice(
    @Req() req: Request,
    @Body() body: UpdateComplexMinOrderingPriceDto,
    @Param("complexId") complexId: string
  ) {
    const theUser = req.currentUser;
    const theRecord = await this.putService.updateMinOrderPrice({
      price: body.min_order_price,
      complex_id: complexId,
      author_id: theUser._id.toString(),
    });
    return theRecord;
  }

  @Put("/promoted-products/:complexId")
  @AccessLevel([1, 2, 10])
  @UseGuards(HasAccessGuard)
  async updatePromotedProducts(
    @Req() req: Request,
    @Body() body: UpdateComplexPromotedProductsDto,
    @Param("complexId") complexId: string
  ) {
    const theUser = req.currentUser;
    return await this.putService.updatePromotedProducts({
      products: body.products,
      complex_id: complexId,
      author_id: theUser._id.toString(),
    });
  }
}
