import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Delete,
  Put,
  UseGuards,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import { CreateProductFolderDto } from "./dto/create.dto";
import { IsAdminGuard } from "src/guards/admin.guard";
import { ProductFolderService } from "./folder.service";
import { AccessLevel } from "src/helpers/decorators";
import { HasAccessGuard } from "src/guards/access.guard";
import { EditProductFolderDto } from "./dto/edit.dto";
import { reorderCategoriesDto } from "./dto/reorder";
import { Request } from "express";
import { messages } from "src/helpers/constants";

@Controller("product-folder")
export class ProductFolderController {
  constructor(private service: ProductFolderService) {}

  @Get("/complex/:complexId")
  async findAllComplexFolders(@Param("complexId") complexId: string) {
    return await this.service.findComplexFolders(complexId);
  }

  @Get("/complex/active/:complexId")
  async findAllActiveComplexFolders(@Param("complexId") complexId: string) {
    return await this.service.findComplexActiveFolders(complexId);
  }

  @Get("/products/:id")
  async findFolderProducts(@Param("id") categoryId: string) {
    return await this.service.findFolderProducts(categoryId);
  }

  @Get("/:id")
  async findById(@Param("id") categoryId: string) {
    return await this.service.findById(categoryId);
  }

  @Post("/:complexId")
  @AccessLevel([1, 2, 10])
  @UseGuards(HasAccessGuard)
  async create(
    @Req() req: Request,
    @Param("complexId") complexId: string,
    @Body() body: CreateProductFolderDto
  ) {
    const theUser = req.currentUser;
    if (!theUser?._id) throw new UnauthorizedException(messages[401]);
    return await this.service.create({
      ...body,
      complex_id: complexId,
      user_id: theUser._id.toString(),
    });
  }

  @Put("/reorder/:complexId")
  @AccessLevel([1, 2, 10])
  @UseGuards(HasAccessGuard)
  async reorderCategories(
    @Req() req: Request,
    @Param("complexId") complexId: string,
    @Body() body: reorderCategoriesDto
  ) {
    const theUser = req.currentUser;
    if (!theUser?._id) throw new UnauthorizedException(messages[401]);
    return await this.service.reorderCategories({
      complex_id: complexId,
      categories: body.categories,
      user_id: theUser._id.toString(),
    });
  }

  @Put("/:complexId/:id")
  @AccessLevel([1, 2, 10])
  @UseGuards(HasAccessGuard)
  async editItem(
    @Req() req: Request,
    @Param("id") categoryId: string,
    @Param("complexId") complexId: string,
    @Body() body: EditProductFolderDto
  ) {
    const theUser = req.currentUser;
    if (!theUser?._id) throw new UnauthorizedException(messages[401]);
    return await this.service.findAndEdit({
      id: categoryId,
      complex_id: complexId,
      user_id: theUser._id.toString(),
      ...body,
    });
  }

  @Delete("/:complexId/:id")
  @AccessLevel([1, 2, 10])
  @UseGuards(HasAccessGuard)
  @UseGuards(IsAdminGuard)
  async deleteItem(
    @Req() req: Request,
    @Param("id") categoryId: string,
    @Param("complexId") complexId: string
  ) {
    const theUser = req.currentUser;
    if (!theUser?._id) throw new UnauthorizedException(messages[401]);
    return await this.service.deleteOne({
      id: categoryId,
      complex_id: complexId,
      user_id: theUser._id.toString(),
    });
  }
}
