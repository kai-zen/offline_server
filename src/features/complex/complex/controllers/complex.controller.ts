import { ComplexActionsService } from "../service/complex-actions.service";
import { ComplexFetchService } from "../service/comlex-fetch.service";
import { CreateComplexDto } from "../dto/create.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { filepathToUrl } from "src/helpers/functions";
import { imageUploadConfig, imageValidator } from "src/helpers/constants";
import { IsAdminGuard } from "src/guards/admin.guard";
import { IsLoggedInGuard } from "src/guards/auth.guard";
import { IsOwnerGuard } from "src/guards/owner.guard";
import { Request } from "express";
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";

@Controller("complex")
export class ComplexController {
  constructor(
    private readonly service: ComplexFetchService,
    private readonly actionsService: ComplexActionsService
  ) {}

  @Get()
  async findAll(@Query() queryParams: { [props: string]: string }) {
    return await this.service.findByLocation(queryParams);
  }

  @Get("/tags")
  async findByTags(@Query() queryParams: { [props: string]: string }) {
    return await this.service.findByTags(queryParams);
  }

  @UseGuards(IsAdminGuard)
  @Get("/admin")
  async adminFindComplexes(@Query() queryParams: { [props: string]: string }) {
    return await this.service.findAll(queryParams);
  }

  @Get("/ids")
  async findAllIDs() {
    return await this.service.findAllIDs();
  }

  @Get("/username/:username")
  async findByUsername(@Param("username") username: string) {
    return await this.service.findById(username, true);
  }

  @Get("/domain/:domain")
  async findByDomain(@Param("domain") domain: string) {
    return await this.service.findByDomain(domain);
  }

  @Get("/sitemap/:domain")
  async sitemap(@Param("domain") domain: string) {
    return await this.service.sitemapByDomain(domain);
  }

  @Get("/finance/:complexId")
  @UseGuards(IsOwnerGuard)
  async findComplexFinance(@Param("complexId") complexId: string) {
    return await this.service.financeData(complexId);
  }

  @Get("/:complexId")
  async findById(@Param("complexId") complexId: string) {
    return await this.service.findById(complexId);
  }

  @UseInterceptors(FileInterceptor("file", imageUploadConfig))
  @Post()
  @UseGuards(IsLoggedInGuard)
  async create(
    @Req() req: Request,
    @Body() body: CreateComplexDto,
    @UploadedFile(imageValidator(false)) file: Express.Multer.File
  ) {
    const { name, description, category } = body || {};
    const theUser = req.currentUser;
    const newRecord = await this.actionsService.create(theUser, {
      name,
      description,
      category,
      file: filepathToUrl(file?.path),
    });
    return newRecord;
  }

  @UseInterceptors(FileInterceptor("file", imageUploadConfig))
  @Post("/admin")
  @UseGuards(IsAdminGuard)
  async createByAdmin(
    @Body() body: CreateComplexDto,
    @UploadedFile(imageValidator(false)) file: Express.Multer.File
  ) {
    const { name, description, category } = body || {};
    const newRecord = await this.actionsService.createByAdmin({
      name,
      description,
      category,
      file: filepathToUrl(file?.path),
    });
    return newRecord;
  }

  @Delete("/:id")
  @UseGuards(IsAdminGuard)
  async deleteItem(@Param("id") recordId: string) {
    return await this.actionsService.deleteOne(recordId);
  }
}
