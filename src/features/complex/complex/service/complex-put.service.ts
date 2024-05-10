import { AccessService } from "src/features/user/access/access.service";
import { CityService } from "src/features/management/city/city.service";
import { ComplexCategoryService } from "src/features/category/complex-category/complex-category.service";
import { ComplexDocument } from "../complex.schema";
import { Cron, CronExpression } from "@nestjs/schedule";
import { deleteFile, toObjectId } from "src/helpers/functions";
import { InjectModel } from "@nestjs/mongoose";
import { messages } from "src/helpers/constants";
import { Model, Types } from "mongoose";
import { UserService } from "src/features/user/users/user.service";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ActivityService } from "../../activities/activities.service";

@Injectable()
export class ComplexPutService {
  constructor(
    @InjectModel("complex")
    private readonly model: Model<ComplexDocument>,
    private readonly userService: UserService,
    private readonly complexCategoryService: ComplexCategoryService,
    private readonly cityService: CityService,
    private readonly accessService: AccessService,
    private readonly logService: ActivityService
  ) {}

  async findAndEdit(
    id: string,
    newData: {
      name: string;
      file: string;
      description: string;
      category: string;
      username: string;
      author_id: string;
    }
  ) {
    const { name, file, description, category, username, author_id } =
      newData || {};
    const theRecord = await this.model.findById(id);
    const newCategory = await this.complexCategoryService.findById(category);
    if (!newCategory || !theRecord) throw new NotFoundException();

    if (file) {
      deleteFile(theRecord.image);
      theRecord.image = file;
    }
    theRecord.name = name;
    theRecord.description = description;
    theRecord.category = newCategory;
    theRecord.username = username;
    await this.logService.create({
      complex_id: id,
      type: 2,
      description: "اطلاعات پایه مجموعه تغییر کرد.",
      user_id: author_id,
    });
    return await theRecord.save();
  }

  async updateAddress(data: {
    complex_id: string;
    body: {
      name: string;
      description: string;
      city_id: string;
      latitude: number;
      longitude: number;
      phone: string;
      has_sale: boolean;
      has_reserve: boolean;
      auto_copy_addresses: boolean;
    };
    author_id: string;
  }) {
    const { author_id, body, complex_id } = data;
    const {
      city_id,
      has_sale,
      has_reserve,
      latitude,
      longitude,
      auto_copy_addresses,
      ...otherData
    } = body;
    const theRecord = await this.model.findById(complex_id);
    const theCity = await this.cityService.findById(city_id);
    if (!theRecord || !theCity) throw new NotFoundException();
    theRecord.address = {
      ...otherData,
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      city: theCity,
    };
    theRecord.has_sale = Boolean(has_sale);
    theRecord.has_reserve = Boolean(has_reserve);
    theRecord.auto_copy_addresses = Boolean(auto_copy_addresses);
    await this.logService.create({
      complex_id,
      type: 2,
      description: "آدرس مجموعه تغییر کرد.",
      user_id: author_id,
    });
    return await theRecord.save();
  }

  async changeUsername(id: string, username: string) {
    const theRecord = await this.model.findById(id);
    if (!theRecord) throw new NotFoundException(messages[404]);
    const doesItExist = await this.model.exists({ username });
    if (doesItExist)
      throw new BadRequestException("نام‌کاربری انتخاب شده تکراری است.");
    theRecord.username = username;
    await theRecord.save();
  }

  async changeOwner(data: { complex_id: string; mobile: string }) {
    const { complex_id, mobile } = data;
    const theComplex = await this.model.findById(complex_id);
    if (!theComplex) throw new NotFoundException(messages[404]);

    let user = await this.userService.findByMobile(mobile);
    if (!user) user = await this.userService.createUser(mobile);

    await this.accessService.changeOwner(data);
    theComplex.owner = user;
    return await theComplex.save();
  }

  async changeExpirationDate(id: string, new_expiration_date: Date) {
    const theRecord = await this.model.findById(id);
    if (!theRecord) throw new NotFoundException(messages[404]);
    theRecord.expiration_date = new_expiration_date;
    return await theRecord.save();
  }

  async updateGateway(data: {
    gate_id: string;
    complex_id: string;
    author_id: string;
  }) {
    const { gate_id, complex_id, author_id } = data || {};
    const theComplex = await this.model.findById(complex_id);
    if (!theComplex) throw new NotFoundException(messages[404]);
    const before = theComplex.gateway.gate_id;
    theComplex.gateway = { gate_id, type: 1 };
    await this.logService.create({
      complex_id,
      type: 2,
      description: "اطلاعات درگاه پرداخت آنلاین تغییر کرد.",
      before,
      after: gate_id,
      user_id: author_id,
    });
    return await theComplex.save();
  }

  async updateEnamad(data: {
    namad_id: string;
    namad_code: string;
    complex_id: string;
    author_id: string;
  }) {
    const { namad_code, namad_id, complex_id, author_id } = data || {};
    const theComplex = await this.model.findById(complex_id);
    if (!theComplex) throw new NotFoundException(messages[404]);
    const before = JSON.stringify(theComplex.enamad);
    await this.logService.create({
      complex_id,
      type: 2,
      description: "اطلاعات اینماد تغییر کرد.",
      before,
      after: JSON.stringify({ namad_code, namad_id }),
      user_id: author_id,
    });
    theComplex.enamad = { namad_code, namad_id };
    return await theComplex.save();
  }

  async updateColor(data: {
    color: string;
    complex_id: string;
    author_id: string;
  }) {
    const { color, complex_id, author_id } = data || {};
    const theComplex = await this.model.findById(complex_id);
    if (!theComplex) throw new NotFoundException(messages[404]);
    const before = theComplex.color;
    theComplex.color = color;
    await this.logService.create({
      complex_id,
      type: 2,
      description: "رنگ وبسایت مجموعه تغییر کرد.",
      before,
      after: color,
      user_id: author_id,
    });
    return await theComplex.save();
  }

  async updateDomain(data: {
    domain: string;
    complex_id: string;
    author_id: string;
  }) {
    const { domain, complex_id, author_id } = data || {};
    const theComplex = await this.model.findById(complex_id);
    if (!theComplex) throw new NotFoundException(messages[404]);
    const before = theComplex.domain;
    theComplex.domain = domain;
    await this.logService.create({
      complex_id,
      type: 2,
      description: "دامنه وبسایت مجموعه تغییر کرد.",
      before,
      after: domain,
      user_id: author_id,
    });
    return await theComplex.save();
  }

  async toggleActivation(id: string) {
    const theRecord = await this.model.findById(id);
    if (!theRecord) throw new NotFoundException(messages[404]);
    theRecord.is_active = !theRecord.is_active;
    return await theRecord.save();
  }

  async toggleIsWebsite(id: string) {
    const theRecord = await this.model.findById(id);
    if (!theRecord) throw new NotFoundException(messages[404]);
    theRecord.is_website = !theRecord.is_website;
    return await theRecord.save();
  }

  async rateComplexOrder(complex_id: string, rate: 1 | 2 | 3 | 4 | 5) {
    const theRecord = await this.model.findById(complex_id);
    if (!theRecord) throw new NotFoundException(messages[404]);
    ++theRecord.total_comments;
    theRecord.total_points += rate;
    return await theRecord.save();
  }

  async updatePacking(data: {
    cost: number;
    complex_id: string;
    author_id: string;
  }) {
    const { cost, complex_id, author_id } = data || {};
    const theComplex = await this.model.findById(complex_id);
    if (!theComplex) throw new NotFoundException(messages[404]);
    const before = theComplex.packing.toLocaleString();
    theComplex.packing = cost;
    await this.logService.create({
      complex_id,
      type: 2,
      description: "هزینه بسته بندی مجموعه تغییر کرد.",
      before,
      after: cost.toLocaleString(),
      user_id: author_id,
    });
    return await theComplex.save();
  }

  async updateMinOrderPrice(data: {
    price: number;
    complex_id: string;
    author_id: string;
  }) {
    const { price, complex_id, author_id } = data || {};
    const theComplex = await this.model.findById(complex_id);
    if (!theComplex) throw new NotFoundException();
    const before = theComplex.min_online_ordering_price.toLocaleString();
    theComplex.min_online_ordering_price = price;
    await this.logService.create({
      complex_id,
      type: 2,
      description: "حداقل مبلغ ثبت سفارش آنلاین تغییر کرد.",
      before,
      after: price.toLocaleString(),
      user_id: author_id,
    });
    return await theComplex.save();
  }

  async updateMaxRange(complex_id: string | Types.ObjectId, new_range: number) {
    const theComplex = await this.model.findById(complex_id);
    if (!theComplex) throw new NotFoundException();
    theComplex.max_range = new_range;
    return await theComplex.save();
  }

  async updateBalance(complex_id: string | Types.ObjectId, amount: number) {
    const theComplex = await this.model.findById(complex_id);
    if (!theComplex) throw new NotFoundException();
    theComplex.balance += theComplex.is_website ? 0 : (amount / 100) * 91;
    return await theComplex.save();
  }

  async updateSettings(data: {
    complex_id: string | Types.ObjectId;
    settings: {
      has_reserve: boolean;
      has_sale: boolean;
      auto_copy_addresses: boolean;
    };
    author_id: string;
  }) {
    const { author_id, complex_id, settings } = data;
    const { has_reserve, has_sale, auto_copy_addresses } = settings;
    const theComplex = await this.model.findById(complex_id);
    if (!theComplex) throw new NotFoundException(messages[404]);
    theComplex.has_reserve = Boolean(has_reserve);
    theComplex.has_sale = Boolean(has_sale);
    theComplex.auto_copy_addresses = Boolean(auto_copy_addresses);
    await this.logService.create({
      complex_id:
        typeof complex_id === "string" ? complex_id : complex_id.toString(),
      type: 2,
      description: "تنظیمات فعالیت مجموعه تغییر کرد.",
      user_id: author_id,
    });
    return await theComplex.save();
  }

  async updatePromotedProducts(data: {
    products: string[];
    complex_id: string;
    author_id: string;
  }) {
    const { products, complex_id, author_id } = data || {};
    const theComplex = await this.model.findOne({ _id: complex_id });
    if (!theComplex) throw new NotFoundException();
    const [aggregateResult] = await this.model.aggregate([
      { $match: { _id: theComplex._id } },
      { $limit: 1 },
      {
        $lookup: {
          from: "products",
          as: "products",
          let: { complex_id: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$complex", "$$complex_id"] },
                    {
                      $in: [
                        "$_id",
                        products.map((product) => toObjectId(product)),
                      ],
                    },
                  ],
                },
              },
            },
            { $limit: 3 },
          ],
        },
      },
      { $project: { products: 1 } },
    ]);
    if (!aggregateResult) throw new BadRequestException(messages[400]);
    theComplex.promoted_products =
      aggregateResult.products.length > 0 ? aggregateResult.products : [];
    await this.logService.create({
      complex_id,
      type: 2,
      description: "محصولات شاخص مجموعه تغییر کرد.",
      user_id: author_id,
    });
    return await theComplex.save();
  }

  async updateTags(data: {
    tags: string[];
    complex_id: string;
    author_id: string;
  }) {
    const { tags, complex_id, author_id } = data || {};
    const theComplex = await this.model.findOne({ _id: complex_id });
    if (!theComplex) throw new NotFoundException();
    const [aggregateResult] = await this.model.aggregate([
      { $match: { _id: theComplex._id } },
      { $limit: 1 },
      {
        $lookup: {
          from: "tags",
          as: "tags",
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$_id", tags.map((product) => toObjectId(product))],
                },
              },
            },
          ],
        },
      },
      { $project: { tags: 1 } },
    ]);
    if (!aggregateResult) throw new BadRequestException(messages[400]);
    theComplex.tags = Boolean(aggregateResult.tags.length)
      ? aggregateResult.tags
      : [];
    await this.logService.create({
      complex_id,
      type: 2,
      description: "تگ های مجموعه تغییر کرد.",
      user_id: author_id,
    });
    return await theComplex.save();
  }

  async chargeSms(data: {
    complex_id: string;
    new_budget?: number;
    used_count?: number;
  }) {
    const { complex_id, new_budget, used_count } = data;
    const theComplex = await this.model.findById(complex_id);
    if (!theComplex) throw new NotFoundException(messages[404]);
    if (new_budget) theComplex.sms_budget = new_budget;
    else if (used_count) {
      if (theComplex.sms_budget > used_count)
        theComplex.sms_budget -= used_count;
      else
        throw new BadRequestException(
          "برای ارسال این تعداد پیامک نیاز است حسابتان را شارژ کنید."
        );
    }
    return await theComplex.save();
  }

  async setTax(data: { complex_id: string; tax: number; author_id: string }) {
    const { complex_id, tax, author_id } = data;
    const theComplex = await this.model.findById(complex_id);
    if (!theComplex) throw new NotFoundException(messages[404]);
    if (tax > 50 || tax < 1)
      throw new BadRequestException(
        "درصصد وارد شده برای مالیات باید بین یک تا پنجاه باشد."
      );
    theComplex.tax = tax;
    await this.logService.create({
      complex_id,
      type: 2,
      description: `${tax} درصد مالیات برای سفارشات کاربران از مجموعه ثبت شد.`,
      user_id: author_id,
    });
    return await theComplex.save();
  }

  async setService(data: {
    complex_id: string;
    service: number;
    author_id: string;
  }) {
    const { complex_id, service, author_id } = data;
    const theComplex = await this.model.findById(complex_id);
    if (!theComplex) throw new NotFoundException(messages[404]);
    theComplex.service = service || 0;
    await this.logService.create({
      complex_id,
      type: 2,
      description: `${service.toLocaleString()} تومان حق سرویس برای سفارشات کاربران از مجموعه ثبت شد.`,
      user_id: author_id,
    });
    return await theComplex.save();
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM, {
    name: "complex-activation-cron",
    timeZone: "Asia/Tehran",
  })
  async handleCron() {
    await this.model
      .updateMany(
        { expiration_date: { $lte: new Date() } },
        {
          $set: { is_active: false },
        }
      )
      .exec();
  }
}
