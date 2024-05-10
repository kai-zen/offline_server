import { AccessService } from "src/features/user/access/access.service";
import { ComplexCategoryService } from "src/features/category/complex-category/complex-category.service";
import { ComplexDocument } from "../complex.schema";
import { deleteFile } from "src/helpers/functions";
import { InjectModel } from "@nestjs/mongoose";
import { messages } from "src/helpers/constants";
import { Model } from "mongoose";
import { UserDocument } from "src/features/user/users/user.schema";
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";

@Injectable()
export class ComplexActionsService {
  constructor(
    @InjectModel("complex")
    private readonly model: Model<ComplexDocument>,
    private readonly accessService: AccessService,
    private readonly complexCategoryService: ComplexCategoryService
  ) {}

  async create(
    theUser: UserDocument,
    data: {
      name: string;
      file: string;
      description: string;
      category: string;
    }
  ) {
    const { name, file, description, category } = data || {};
    const theCategory = await this.complexCategoryService.findById(category);
    if (!theCategory) throw new NotFoundException();
    if (!theUser) throw new UnauthorizedException();

    const newRecord = new this.model({
      name,
      image: file || "",
      description,
      category,
      owner: theUser._id,
    });
    await newRecord.save();

    this.accessService.create({
      type: 1,
      mobile: theUser.mobile,
      complex: newRecord._id.toString(),
    });

    return newRecord;
  }

  async createByAdmin(data: {
    name: string;
    file: string;
    description: string;
    category: string;
  }) {
    const { name, file, description, category } = data || {};
    const theCategory = await this.complexCategoryService.findById(category);
    if (!theCategory) throw new NotFoundException(messages[404]);

    const newRecord = new this.model({
      name,
      image: file || "",
      description,
      category,
    });
    return await newRecord.save();
  }

  async deleteOne(id: string) {
    const theRecord = await this.model.findById(id);
    if (!theRecord) throw new NotFoundException();
    deleteFile(theRecord.image);
    await this.model.deleteOne({ _id: id });
    return "success";
  }
}
