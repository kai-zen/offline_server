import { InjectModel } from "@nestjs/mongoose";
import { messages } from "src/helpers/constants";
import { Model } from "mongoose";
import { ShippingRangeService } from "src/features/complex/shipping-range/shipping-range.service";
import { toObjectId } from "src/helpers/functions";
import { Injectable, NotFoundException } from "@nestjs/common";
import { ComplexUsersFetchService } from "src/features/complex/users/service/complex-user-fetch.service";
import { ComplexUserAddress } from "./user-address.schema";
import { UserService } from "src/features/user/users/user.service";
import { ComplexFetchService } from "../complex/comlex.service";
import { ActivityService } from "../activities/activities.service";

@Injectable()
export class ComplexUserAddressService {
  constructor(
    @InjectModel("complex-user-address")
    private readonly model: Model<ComplexUserAddress>,
    private readonly userService: UserService,
    private readonly shippingRangeService: ShippingRangeService,
    private readonly complexUserService: ComplexUsersFetchService,
    private readonly complexService: ComplexFetchService,
    private readonly logService: ActivityService
  ) {}

  async findByUser(complexId: string, user_id: string) {
    return await this.model
      .find({ user: toObjectId(user_id), complex: toObjectId(complexId) })
      .select("-user")
      .exec();
  }

  async findByUserWithShppingPrices(complexId: string, user_id: string) {
    const results = await this.model
      .find({ user: toObjectId(user_id), complex: toObjectId(complexId) })
      .select("-user")
      .lean()
      .exec();

    const addressesWithShippingPrice = [];
    for await (const address of results) {
      const { latitude, longitude } = address || {};
      const shippingPrice =
        (
          await this.shippingRangeService.findCorrespondingRange(
            [latitude, longitude],
            complexId
          )
        )?.price || null;
      addressesWithShippingPrice.push({
        ...address,
        shipping: shippingPrice || "not in range",
      });
    }

    return addressesWithShippingPrice;
  }

  async findByMobile(mobile: string, complexId: string) {
    let user = await this.userService.findByMobile(mobile);
    if (!user) user = await this.userService.createUser(mobile);
    const complexuser = await this.complexUserService.findByUserAndComplexBrief(
      user._id.toString(),
      complexId
    );
    const results = await this.model
      .find({ user: user._id, complex: toObjectId(complexId) })
      .exec();

    return {
      addresses: results,
      user: {
        image: user.image,
        name: user.name,
        mobile: user.mobile,
        username: user.username,
        _id: user._id,
        ...complexuser,
      },
    };
  }

  async findById(id: string) {
    return await this.model.findById(id).exec();
  }

  async create(data: {
    name: string;
    description: string;
    details: string;
    latitude: number;
    longitude: number;
    complex_id: string;
    user_id: string;
  }) {
    const {
      name,
      description,
      latitude,
      longitude,
      user_id,
      complex_id,
      details,
    } = data || {};

    const theComplex = await this.complexService.findById(complex_id);
    if (!theComplex) throw new NotFoundException(messages[404]);

    const newRecord = new this.model({
      name,
      description,
      user: toObjectId(user_id),
      complex: theComplex,
      latitude,
      longitude,
      details,
    });
    return await newRecord.save();
  }

  async addByOrdering(data: {
    address: {
      name: string;
      description: string;
      latitude: number;
      longitude: number;
    };
    complex_id: string;
    user_id: string;
  }) {
    const { address, user_id, complex_id } = data;
    const { name, description, latitude, longitude } = address || {};

    const doesItExist = await this.model.exists({
      description,
      user: toObjectId(user_id),
      complex: toObjectId(complex_id),
    });
    if (doesItExist) return;

    const newRecord = new this.model({
      name,
      description,
      user: toObjectId(user_id),
      complex: toObjectId(complex_id),
      latitude,
      longitude,
      details: "",
    });
    return await newRecord.save();
  }

  async findAndEdit(
    id: string,
    newData: {
      name: string;
      description: string;
      details: string;
      latitude: number;
      longitude: number;
      complex_id: string;
    },
    author_id: string
  ) {
    const { name, description, latitude, longitude, details, complex_id } =
      newData || {};

    const theRecord = await this.model.findOne({
      _id: id,
      complex: toObjectId(complex_id),
    });
    if (!theRecord) throw new NotFoundException(messages[404]);

    const oldDescription = theRecord.description;
    theRecord.name = name;
    theRecord.description = description;
    theRecord.details = details;
    theRecord.latitude = latitude;
    theRecord.longitude = longitude;

    await this.logService.create({
      complex_id,
      type: 2,
      description: `آدرس(${oldDescription}) اشتراک ویرایش شد.`,
      user_id: author_id,
    });

    return await theRecord.save();
  }

  async deleteOne(id: string, complex_id: string, author_id: string) {
    const theRecord = await this.model.findOne({
      _id: id,
      complex: toObjectId(complex_id),
    });
    if (!theRecord) throw new NotFoundException(messages[404]);

    await this.logService.create({
      complex_id,
      type: 3,
      description: `آدرس(${theRecord.description}) اشتراک حذف شد.`,
      user_id: author_id,
    });
    await this.model.deleteOne({ _id: id, complex: toObjectId(complex_id) });
    return "success";
  }
}
