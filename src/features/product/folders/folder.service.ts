import { InjectModel } from "@nestjs/mongoose";
import { messages } from "src/helpers/constants";
import { Model } from "mongoose";
import { ProductFolderDocument } from "./folder.schema";
import { toObjectId } from "src/helpers/functions";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ActivityService } from "src/features/complex/activities/activities.service";

@Injectable()
export class ProductFolderService {
  constructor(
    @InjectModel("product-folder")
    private readonly model: Model<ProductFolderDocument>,
    private readonly logService: ActivityService
  ) {}

  async findComplexFolders(complex_id: string) {
    return await this.model
      .find({ complex: complex_id })
      .sort({ row: 1 })
      .select("-complex");
  }

  async findById(id: string) {
    return await this.model.findById(id);
  }

  async findFolderProducts(id: string) {
    const [result] = await this.model.aggregate([
      {
        $match: { _id: toObjectId(id) },
      },
      { $limit: 1 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "folder",
          as: "products",
        },
      },
    ]);
    return result?.products || [];
  }

  async findComplexActiveFolders(complex_id: string) {
    const results = await this.model.aggregate([
      { $match: { complex: toObjectId(complex_id) } },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "folder",
          as: "products",
        },
      },
      { $match: { products: { $ne: [] } } },
      { $sort: { row: 1 } },
    ]);
    return results;
  }

  async create(data: {
    name: string;
    complex_id: string;
    user_id: string;
    end_at?: number;
    start_at?: number;
  }) {
    const { name, complex_id, end_at, start_at, user_id } = data || {};

    const folderWithSameName = await this.model.exists({
      complex: complex_id,
      name,
    });
    if (folderWithSameName)
      throw new BadRequestException(
        "دسته بندی که قصد اضافه کردن آن را دارید را قبلا ساحته اید."
      );

    const totalDocuments =
      (await this.model
        .find({ complex: complex_id })
        .countDocuments()
        .exec()) || 0;

    const newRecord = new this.model(
      start_at && end_at
        ? {
            name,
            complex: toObjectId(complex_id),
            start_at,
            end_at,
            row: totalDocuments + 1,
          }
        : { name, complex: toObjectId(complex_id), row: totalDocuments + 1 }
    );
    await this.logService.create({
      complex_id,
      type: 1,
      description: `دسته بندی ${name} ساخته شد.`,
      user_id,
    });
    return await newRecord.save();
  }

  async findAndEdit(data: {
    id: string;
    name: string;
    complex_id: string;
    user_id: string;
    end_at?: number;
    start_at?: number;
  }) {
    const { end_at, id, complex_id, name, start_at, user_id } = data;
    const theRecord = await this.model.findOne({
      _id: id,
      complex: complex_id,
    });
    if (!theRecord) throw new NotFoundException(messages[404]);
    theRecord.name = name;
    if (end_at && start_at) {
      theRecord.end_at = end_at;
      theRecord.start_at = start_at;
    } else {
      theRecord.end_at = null;
      theRecord.start_at = null;
    }
    await this.logService.create({
      complex_id,
      type: 2,
      description: `دسته بندی ${name} ویرایش شد.`,
      user_id,
    });
    return await theRecord.save();
  }

  async reorderCategories(data: {
    categories: { id: string; row: number }[];
    complex_id: string;
    user_id: string;
  }) {
    const { categories, complex_id, user_id } = data;
    for await (const category of categories) {
      const theCat = await this.model.findOne({
        _id: category.id,
        complex: complex_id,
      });
      if (theCat) {
        theCat.row = category.row;
        await theCat.save();
      }
    }
    await this.logService.create({
      complex_id,
      type: 2,
      description: "ترتیب دسته بندی ها در منو تغییر کرد.",
      user_id,
    });
    return "success";
  }

  async deleteOne(data: { id: string; complex_id: string; user_id: string }) {
    const { complex_id, id, user_id } = data;
    const theFolderProducts = await this.findFolderProducts(id);
    if (theFolderProducts.length > 0)
      throw new BadRequestException(
        "پیش از حذف دسته بندی باید محصولات درون آن را به دسته بندی دیگری انتقال دهید."
      );
    await this.model.deleteOne({ _id: id, complex: complex_id });
    await this.logService.create({
      complex_id,
      type: 3,
      description: "دسته بندی حذف شد.",
      user_id,
    });
    return "success";
  }
}
