import { ComplexFetchService } from "../complex/service/comlex-fetch.service";
import { ComplexPutService } from "../complex/service/complex-put.service";
import { distanceCalculator, toObjectId } from "src/helpers/functions";
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { messages } from "src/helpers/constants";
import { Model } from "mongoose";
import { ShippingRange } from "./shipping-range.schema";
import { ActivityService } from "../activities/activities.service";

@Injectable()
export class ShippingRangeService {
  constructor(
    @InjectModel("shipping-range")
    private readonly model: Model<ShippingRange>,
    private readonly complexService: ComplexFetchService,
    private readonly complexPutService: ComplexPutService,
    private readonly logService: ActivityService
  ) {}

  async findByComplex(complex_id: string) {
    return await this.model
      .find({ complex: complex_id })
      .sort({ radius: 1 })
      .exec();
  }

  async findById(id: string) {
    return await this.model.findById(id);
  }

  async findCorrespondingRange(coords: [number, number], complex_id: string) {
    const theComplex = await this.complexService.findById(complex_id);
    if (!theComplex) throw new NotFoundException("مجموعه پیدا نشد.");

    const [latitude, longitude] = coords;
    const [complexLongitude, complexLatitude] =
      theComplex.address?.location?.coordinates || [];

    if (!complexLatitude || !complexLongitude)
      throw new NotFoundException(messages[404]);

    const theDistance = distanceCalculator(
      [complexLatitude, complexLongitude],
      [latitude, longitude]
    );
    const ranges = await this.model
      .find({
        $and: [
          { radius: { $gt: theDistance } },
          { complex: toObjectId(complex_id) },
        ],
      })
      .sort({ radius: 1 });
    return ranges?.[0] || null;
  }

  async create(data: {
    radius: number;
    price: number;
    is_active: boolean;
    complex_id: string;
    author_id: string;
  }) {
    const { radius, price, complex_id, is_active, author_id } = data || {};
    const newRecord = new this.model({
      radius,
      price,
      complex: toObjectId(complex_id),
      is_active: Boolean(is_active),
    });
    const createResult = await newRecord.save();
    await this.logService.create({
      complex_id,
      type: 1,
      description: `محدوده ارسال ${radius.toLocaleString()} متری ساخته شد.`,
      user_id: author_id,
    });

    const [biggestRange] = await this.model
      .find({ complex: complex_id, is_active: true })
      .sort({ radius: -1 });
    if (biggestRange)
      await this.complexPutService.updateMaxRange(
        complex_id,
        biggestRange.radius
      );

    return createResult;
  }

  async findAndEdit(data: {
    id: string;
    body: {
      radius: number;
      price: number;
      is_active: boolean;
    };
    author_id: string;
  }) {
    const { id, body, author_id } = data;
    const { radius, price, is_active } = body || {};
    const theRecord = await this.model.findById(id);
    if (!theRecord) throw new NotFoundException();

    const before = JSON.stringify({
      radius: theRecord.radius,
      price: theRecord.price,
      is_active: theRecord.is_active,
    });

    theRecord.radius = radius;
    theRecord.price = price;
    theRecord.is_active = Boolean(is_active);
    const editResult = await theRecord.save();

    const [biggestRange] = await this.model
      .find({ complex: theRecord.complex._id, is_active: true })
      .sort({ radius: -1 });
    if (biggestRange)
      await this.complexPutService.updateMaxRange(
        theRecord.complex._id,
        biggestRange.radius
      );

    await this.logService.create({
      complex_id: theRecord.complex._id.toString(),
      type: 2,
      description: "محدوده ارسال ویرایش شد.",
      before,
      after: JSON.stringify(body),
      user_id: author_id,
    });

    return editResult;
  }

  async toggleActivation(data: { id: string; author_id: string }) {
    const { id, author_id } = data;
    const theRecord = await this.model.findById(id);
    if (!theRecord) throw new NotFoundException();

    const wasItActive = theRecord.is_active;
    theRecord.is_active = !wasItActive;
    const editResult = await theRecord.save();

    const [biggestRange] = await this.model
      .find({ complex: theRecord.complex._id, is_active: true })
      .sort({ radius: -1 });
    if (biggestRange)
      await this.complexPutService.updateMaxRange(
        theRecord.complex._id,
        biggestRange.radius
      );

    await this.logService.create({
      complex_id: theRecord.complex._id.toString(),
      type: 2,
      description: `محدوده ارسال ${theRecord.radius.toLocaleString()} غیرفعال شد.`,
      user_id: author_id,
    });

    return editResult;
  }

  async deleteOne(data: { id: string; author_id: string }) {
    const { author_id, id } = data;
    const theRecord = await this.model.findById(id);
    if (!theRecord) throw new NotFoundException();

    await this.model.deleteOne({ _id: id });

    const [biggestRange] = await this.model
      .find({ complex: theRecord.complex._id, is_active: true })
      .sort({ radius: -1 });
    if (biggestRange)
      await this.complexPutService.updateMaxRange(
        theRecord.complex._id,
        biggestRange.radius
      );

    await this.logService.create({
      complex_id: theRecord.complex._id.toString(),
      type: 3,
      description: "محدوده ارسال حذف شد.",
      user_id: author_id,
    });

    return "success";
  }
}
