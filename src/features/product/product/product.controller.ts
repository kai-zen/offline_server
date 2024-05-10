import { AccessLevel } from "src/helpers/decorators";
import { CreateProductDto } from "./dto/create.dto";
import { EditPrimaryImageIndexDto } from "./dto/change-primary-image.dto";
import { EditProductDto } from "./dto/edit.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { filepathToUrl } from "src/helpers/functions";
import { HasAccessGuard } from "src/guards/access.guard";
import { IsAdminGuard } from "src/guards/admin.guard";
import { ProductActionsService } from "./service/product-actions.service";
import { ProductFetchService } from "./service/product-fetch.service";
import {
  imageUploadConfig,
  imageValidator,
  messages,
} from "src/helpers/constants";
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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { ChangePriceDto } from "./dto/change-price.dto";
import { Request } from "express";

@Controller("product")
export class ProductController {
  constructor(
    private readonly fetchService: ProductFetchService,
    private readonly actionService: ProductActionsService
  ) {}

  @Get()
  async findByLocation(@Query() queryParams: { [props: string]: string }) {
    return await this.fetchService.findByLocation(queryParams);
  }

  @Get("/admin")
  @UseGuards(IsAdminGuard)
  async findAll(@Query() queryParams: { [props: string]: string }) {
    return await this.fetchService.findAll(queryParams);
  }

  @Get("/complex/:complexId")
  async findAllComplexProducts(@Param("complexId") complexId: string) {
    return await this.fetchService.findComplexProducts(complexId);
  }

  @Get("/complex/unable/:complexId")
  async findAllComplexUnableProducts(@Param("complexId") complexId: string) {
    return await this.fetchService.unableProducts(complexId);
  }

  @Get("/complex/:complexId/stats/past-days/:day")
  @AccessLevel([1, 2, 10])
  @UseGuards(HasAccessGuard)
  async getPastDaysStats(
    @Param("complexId") complexId: string,
    @Param("day") day: string,
    @Query() queryParams: { [props: string]: string }
  ) {
    return await this.fetchService.pastDaysProductsStats({
      complex_id: complexId,
      days: Number(day) || 7,
      params: queryParams,
    });
  }

  @Get("/complex/:complexId/stats")
  @AccessLevel([1, 2, 10])
  @UseGuards(HasAccessGuard)
  async getStats(
    @Param("complexId") complexId: string,
    @Query() queryParams: { [props: string]: string }
  ) {
    const { from } = queryParams;
    if (!from) throw new BadRequestException(messages[400]);
    return await this.fetchService.pastDaysProductsStats({
      complex_id: complexId,
      params: queryParams,
    });
  }

  @Get("/categories/:complexId")
  async findAllComplexProductCategories(@Param("complexId") complexId: string) {
    return await this.fetchService.findComplexProductCategories(complexId);
  }

  @Get("/:id")
  async findById(@Param("id") recordId: string) {
    return await this.fetchService.findById(recordId);
  }

  @Get("/:id/images")
  async findProductImages(@Param("id") recordId: string) {
    const theRecord = await this.fetchService.findById(recordId);
    return theRecord?.images || [];
  }

  @Post()
  @AccessLevel([1, 2, 10])
  @UseGuards(HasAccessGuard)
  async create(@Body() body: CreateProductDto, @Req() req: Request) {
    const theUser = req.currentUser;
    const { category_id, folder_id, complex_id, ...otherBodyData } = body;
    return await this.actionService.create({
      ...otherBodyData,
      category: category_id || undefined,
      complex: complex_id,
      folder: folder_id,
      author_id: theUser._id.toString(),
    });
  }

  @Put("change-price/:complexId")
  @AccessLevel([1, 2])
  @UseGuards(HasAccessGuard)
  async changePrice(
    @Param("complexId") complexId: string,
    @Body() body: ChangePriceDto,
    @Req() req: Request
  ) {
    const theUser = req.currentUser;
    const { percent, products, rounder } = body;
    return await this.actionService.changePrice({
      complex_id: complexId,
      percent,
      productIds: products,
      rounder,
      author_id: theUser._id.toString(),
    });
  }

  @Put("/:complexId/:id")
  @AccessLevel([1, 2, 10])
  @UseGuards(HasAccessGuard)
  async editItem(
    @Param("id") recordId: string,
    @Body() body: EditProductDto,
    @Req() req: Request
  ) {
    const theUser = req.currentUser;
    const { category_id, folder_id, ...otherBodyData } = body;
    return await this.actionService.findAndEdit({
      id: recordId,
      body: {
        ...otherBodyData,
        category: category_id || undefined,
        folder: folder_id,
      },
      author_id: theUser._id.toString(),
    });
  }

  @UseInterceptors(FileInterceptor("file", imageUploadConfig))
  @Post("/:complexId/:id/images")
  @AccessLevel([1, 2, 10])
  @UseGuards(HasAccessGuard)
  async addImage(
    @Param("id") recordId: string,
    @UploadedFile(imageValidator(true)) file: Express.Multer.File,
    @Req() req: Request
  ) {
    const theUser = req.currentUser;
    return await this.actionService.addImage({
      id: recordId,
      imagePath: filepathToUrl(file?.path),
      author_id: theUser._id.toString(),
    });
  }

  @Put("/:complexId/:id/images/change-primary")
  @AccessLevel([1, 2, 10])
  @UseGuards(HasAccessGuard)
  async changePrimaryImage(
    @Param("id") recordId: string,
    @Body() body: EditPrimaryImageIndexDto,
    @Req() req: Request
  ) {
    const theUser = req.currentUser;
    return await this.actionService.changePrimaryIndex({
      id: recordId,
      index: body.new_index,
      author_id: theUser._id.toString(),
    });
  }

  @Put("/:complexId/:id/toggle-activation")
  @AccessLevel([1, 2, 10])
  @UseGuards(HasAccessGuard)
  async toggleActivation(@Param("id") recordId: string, @Req() req: Request) {
    const theUser = req.currentUser;
    return await this.actionService.toggleActivation({
      id: recordId,
      author_id: theUser._id.toString(),
    });
  }

  @Put("/:complexId/:id/toggle-stock")
  @AccessLevel([1, 2, 10])
  @UseGuards(HasAccessGuard)
  async toggleStock(@Param("id") recordId: string, @Req() req: Request) {
    const theUser = req.currentUser;
    return await this.actionService.toggleStock({
      id: recordId,
      author_id: theUser._id.toString(),
    });
  }

  @Delete("/:complexId/:id")
  @AccessLevel([1, 2, 10])
  @UseGuards(HasAccessGuard)
  async deleteItem(@Param("id") recordId: string, @Req() req: Request) {
    const theUser = req.currentUser;
    return await this.actionService.deleteOne({
      id: recordId,
      author_id: theUser._id.toString(),
    });
  }

  @Delete("/:complexId/:id/:imageIndex")
  @AccessLevel([1, 2, 10])
  @UseGuards(HasAccessGuard)
  async deleteImage(
    @Param("id") recordId: string,
    @Param("imageIndex") imageIndex: number,
    @Req() req: Request
  ) {
    if (isNaN(Number(imageIndex))) throw new BadRequestException(messages[400]);
    const theUser = req.currentUser;
    return await this.actionService.removeImage({
      id: recordId,
      index: imageIndex,
      author_id: theUser._id.toString(),
    });
  }
}
