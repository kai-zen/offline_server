import { ComplexFetchService } from "src/features/complex/complex/comlex.service";
import { deleteFile, toObjectId } from "src/helpers/functions";
import { InjectModel } from "@nestjs/mongoose";
import { messages } from "src/helpers/constants";
import { Model, Types } from "mongoose";
import { ProductCategoryService } from "src/features/category/product-category/product-category.service";
import { ProductDocument } from "../product.schema";
import { ProductFolderService } from "src/features/category/folders/folder.service";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ActivityService } from "src/features/complex/activities/activities.service";

@Injectable()
export class ProductActionsService {
  constructor(
    @InjectModel("product")
    private readonly model: Model<ProductDocument>,
    private readonly complexService: ComplexFetchService,
    private readonly productCategoryService: ProductCategoryService,
    private readonly productFolderService: ProductFolderService,
    private readonly logService: ActivityService
  ) {}

  async create(data: {
    name: string;
    description: string;
    prices: { title: string; price: number }[];
    packing: number;
    complex: string;
    folder: string;
    author_id: string;
    is_packable: boolean;
    has_shipping: boolean;
    category?: string;
  }) {
    const {
      name,
      prices,
      packing,
      description,
      category,
      complex,
      folder,
      author_id,
      has_shipping,
      is_packable,
    } = data || {};
    const theComplex = await this.complexService.findById(complex);
    const theFolder = await this.productFolderService.findById(folder);
    if (!theComplex || !theFolder) throw new NotFoundException(messages[404]);

    let theCategory = null;
    if (category)
      theCategory = await this.productCategoryService.findById(category);

    const newRecord = new this.model({
      name,
      description,
      category: theCategory ? theCategory._id : null,
      prices,
      packing: packing || 0,
      complex: theComplex._id,
      folder: theFolder,
      has_shipping,
      is_packable,
    });

    await this.logService.create({
      type: 1,
      description: `محصول ${name} ساخته شد.`,
      complex_id: theComplex._id.toString(),
      user_id: author_id,
      dist: newRecord,
      dist_type: "product",
    });
    return await newRecord.save();
  }

  async addImage(data: { id: string; imagePath: string; author_id: string }) {
    const { author_id, id, imagePath } = data;
    const theRecord = await this.model.findById(id);
    if (!theRecord) throw new NotFoundException();
    theRecord.images.push(imagePath);

    await this.logService.create({
      type: 2,
      description: `محصول ${theRecord.name} ویرایش شد.`,
      complex_id: theRecord.complex._id.toString(),
      user_id: author_id,
      dist: theRecord,
      dist_type: "product",
    });

    return await theRecord.save();
  }

  async changePrimaryIndex(data: {
    id: string;
    index: number;
    author_id: string;
  }) {
    const { author_id, id, index } = data;
    const theRecord = await this.model.findById(id);
    if (!theRecord) throw new NotFoundException(messages[404]);
    if (index >= theRecord.images.length)
      throw new BadRequestException(messages[400]);
    theRecord.primary_image_index = index;
    await this.logService.create({
      type: 2,
      description: `تصویر اصلی محصول ${theRecord.name} ویرایش شد.`,
      complex_id: theRecord.complex._id.toString(),
      user_id: author_id,
      dist: theRecord,
      dist_type: "product",
    });
    return await theRecord.save();
  }

  async removeImage(data: { id: string; index: number; author_id: string }) {
    const { author_id, id, index } = data;
    const theRecord = await this.model.findById(id);
    if (!theRecord) throw new NotFoundException();
    deleteFile(theRecord.images[index]);

    if (index === theRecord.primary_image_index)
      theRecord.primary_image_index === 0;
    else if (index < theRecord.primary_image_index)
      theRecord.primary_image_index--;
    theRecord.images.splice(index, 1);

    await this.logService.create({
      type: 3,
      description: `تصویر محصول ${theRecord.name} حذف شد.`,
      complex_id: theRecord.complex._id.toString(),
      user_id: author_id,
      dist: theRecord,
      dist_type: "product",
    });

    return await theRecord.save();
  }

  async findAndEdit(data: {
    id: string;
    body: {
      name: string;
      description: string;
      prices: { title: string; price: number }[];
      packing: number;
      folder: string;
      has_shipping: boolean;
      is_packable: boolean;
      category?: string;
    };
    author_id: string;
  }) {
    const { author_id, body, id } = data;
    const {
      name,
      prices,
      description,
      category,
      packing,
      folder,
      has_shipping,
      is_packable,
    } = body || {};
    const theRecord = await this.model.findById(id);
    const theFolder = await this.productFolderService.findById(folder);
    if (!theRecord || !theFolder) throw new NotFoundException(messages[404]);

    const newCategory = await this.productCategoryService.findById(category);
    if (newCategory) theRecord.category = newCategory;
    theRecord.name = name;
    theRecord.description = description;
    theRecord.prices = prices;
    theRecord.packing = packing || 0;
    theRecord.folder = theFolder;
    theRecord.has_shipping = has_shipping;
    theRecord.is_packable = is_packable;

    await this.logService.create({
      type: 2,
      description: `محصول ${theRecord.name} ویرایش شد.`,
      complex_id: theRecord.complex._id.toString(),
      user_id: author_id,
      dist: theRecord,
      dist_type: "product",
    });

    return await theRecord.save();
  }

  async toggleActivation(data: { id: string; author_id: string }) {
    const { author_id, id } = data;
    const theRecord = await this.model.findById(id);
    if (!theRecord) throw new NotFoundException();
    const newVal = !theRecord.is_active;
    theRecord.is_active = newVal;

    await this.logService.create({
      type: 2,
      description: `محصول ${theRecord.name} ${newVal ? "فعال" : "غیرفعال"} شد.`,
      complex_id: theRecord.complex._id.toString(),
      user_id: author_id,
      dist: theRecord,
      dist_type: "product",
    });

    return await theRecord.save();
  }

  async toggleStock(data: { id: string; author_id: string }) {
    const { author_id, id } = data;
    const theRecord = await this.model.findById(id);
    if (!theRecord) throw new NotFoundException();
    const newVal = !theRecord.has_stock;
    theRecord.has_stock = newVal;

    await this.logService.create({
      type: 2,
      description: `موجودی محصول ${theRecord.name} ${
        newVal ? "موجود" : "ناموجود"
      } شد.`,
      complex_id: theRecord.complex._id.toString(),
      user_id: author_id,
      dist: theRecord,
      dist_type: "product",
    });

    return await theRecord.save();
  }

  async changePrice(data: {
    complex_id: string;
    productIds: string[];
    percent: number;
    rounder: number;
    author_id: string;
  }) {
    const { complex_id, percent, productIds, rounder, author_id } = data;
    const products = await this.model
      .find({
        $and: [
          { complex: toObjectId(complex_id) },
          { _id: { $in: productIds.map((pid) => toObjectId(pid)) } },
        ],
      })
      .exec();

    for await (const theProduct of products) {
      const copy = [...theProduct.prices];
      copy.forEach((item) => {
        const newPrice = item.price * (1 + percent / 100);
        const roundedPrice = Math.floor(newPrice / rounder) * rounder;
        if (roundedPrice > 0) item.price = roundedPrice;
      });
      theProduct.prices = copy;
      await theProduct.save();
    }

    await this.logService.create({
      type: 2,
      description: `قیمت محصولات به صورت گروهی ${percent} درصد تغییر کرد`,
      complex_id,
      user_id: author_id,
    });

    return "success";
  }

  async deleteOne(data: { id: string; author_id: string }) {
    const { author_id, id } = data;
    const theRecord = await this.model.findById(id);
    if (!theRecord) throw new NotFoundException();
    const [ordersWithThisProduct] = await this.model.aggregate([
      { $match: { _id: toObjectId(id) } },
      { $limit: 1 },
      {
        $lookup: {
          from: "orders",
          let: { product_id: "$_id" },
          pipeline: [
            {
              $match: { $expr: { $in: ["$$product_id", "$products.product"] } },
            },
          ],
          as: "orders_with_product",
        },
      },
      { $match: { orders_with_product: { $ne: [] } } },
    ]);
    if (ordersWithThisProduct)
      throw new BadRequestException(
        "امکان حذف محصولاتی که توسط مشتریان سفارش داده شده اند وجود ندارد."
      );
    theRecord.images.forEach(deleteFile);

    await this.logService.create({
      type: 3,
      description: `محصول ${theRecord.name} حذف شد.`,
      complex_id: theRecord.complex._id.toString(),
      user_id: author_id,
    });

    await this.model.deleteOne({ _id: id });
    return "success";
  }

  async addOrdersCount(id: string | Types.ObjectId) {
    const theRecord = await this.model.findById(id);
    if (!theRecord) throw new NotFoundException();
    theRecord.total_sale++;
    await theRecord.save();
  }

  async addComment(id: string, rate: 1 | 2 | 3 | 4 | 5) {
    const theRecord = await this.model.findById(id);
    if (!theRecord) throw new NotFoundException();
    theRecord.total_points += rate;
    theRecord.total_comments++;
    return await theRecord.save();
  }
}

export default ProductActionsService;
