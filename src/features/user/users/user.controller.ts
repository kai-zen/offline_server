import { EditProfileDto } from "./dto/edit.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { filepathToUrl } from "src/helpers/functions";
import {
  imageUploadConfig,
  imageValidator,
  messages,
} from "src/helpers/constants";
import { Request } from "express";
import { UserService } from "./user.service";
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { IsAdminGuard } from "src/guards/admin.guard";
import { IsLoggedInGuard } from "src/guards/auth.guard";

@Controller("user")
export class UserController {
  constructor(private service: UserService) {}

  @Get()
  @UseGuards(IsAdminGuard)
  async findAll(@Query() queryParams: { [props: string]: string }) {
    return await this.service.findAll(queryParams);
  }

  @Get("/current")
  @UseGuards(IsLoggedInGuard)
  async findCurrentUser(@Req() req: Request) {
    const theUser = req.currentUser;
    return await this.service.userFullData(theUser._id.toString());
  }

  @Get("/check/:username")
  @UseGuards(IsLoggedInGuard)
  async findByUsername(@Param("username") username: string) {
    const theUser = await this.service.findByUsername(username);
    return Boolean(theUser);
  }

  @Get("/:id")
  async findById(@Param("id") complexId: string) {
    return await this.service.findById(complexId);
  }

  @UseInterceptors(FileInterceptor("file", imageUploadConfig))
  @Put("/:id")
  @UseGuards(IsLoggedInGuard)
  async editProfile(
    @Param("id") recordId: string,
    @Req() req: Request,
    @Body() body: EditProfileDto,
    @UploadedFile(imageValidator(false)) file?: Express.Multer.File
  ) {
    if (recordId !== req.currentUser.id.toString())
      throw new ForbiddenException(messages[403]);
    const editedRecord = await this.service.updateProfile(recordId, {
      file: filepathToUrl(file?.path),
      ...body,
    });
    return editedRecord;
  }
}
