import { HttpService } from "@nestjs/axios";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ShippingRangeService } from "src/features/complex/shipping-range/shipping-range.service";
import { toObjectId } from "src/helpers/functions";
import { Injectable, NotFoundException } from "@nestjs/common";
import { ComplexUserAddress } from "./user-address.schema";
import { UserService } from "src/features/user/users/user.service";
import { lastValueFrom } from "rxjs";
import { messages, sofreBaseUrl } from "src/helpers/constants";

@Injectable()
export class ComplexUserAddressService {
  constructor(
    @InjectModel("complex-user-address")
    private readonly model: Model<ComplexUserAddress>,
    private readonly userService: UserService,
    private readonly shippingRangeService: ShippingRangeService,
    private readonly httpService: HttpService
  ) {}

  async findByUser(user_id: string) {
    return await this.model.find({ user: toObjectId(user_id) }).exec();
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
    const user = await this.userService.findByMobile(mobile);

    const results = user
      ? await this.model
          .find({ user: user._id, complex: toObjectId(complexId) })
          .exec()
      : [];

    return {
      addresses: results,
      user: {
        image: user?.image || "",
        name: user?.name || "",
        mobile,
        username: user?.username || "",
        _id: user?._id,
      },
    };
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

    const newRecord = new this.model({
      name,
      description,
      user: toObjectId(user_id),
      complex: toObjectId(complex_id),
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
    }
  ) {
    const { name, description, latitude, longitude, details, complex_id } =
      newData || {};

    const theRecord = await this.model.findOne({
      _id: id,
      complex: toObjectId(complex_id),
    });
    if (!theRecord) throw new NotFoundException(messages[404]);

    theRecord.name = name;
    theRecord.description = description;
    theRecord.details = details;
    theRecord.latitude = latitude;
    theRecord.longitude = longitude;

    return await theRecord.save();
  }

  async deleteOne(id: string) {
    await this.model.deleteOne({ _id: id });
    return "success";
  }

  async updateData() {
    let hasMore = true;
    let page = 1;
    while (hasMore) {
      const res = await lastValueFrom(
        this.httpService.get(
          `${sofreBaseUrl}/complex-user-address/localdb/${process.env.COMPLEX_ID}/${page}`,
          {
            headers: {
              "api-key": process.env.COMPLEX_TOKEN,
            },
          }
        )
      );
      if (res.data && res.data.length > 0) {
        for await (const record of res.data) {
          const modifiedResponse = {
            ...record,
            _id: toObjectId(record._id),
          };
          await this.model.updateOne(
            { _id: modifiedResponse._id },
            { $set: modifiedResponse },
            { upsert: true }
          );
        }
        ++page;
      } else hasMore = false;
    }
  }
}
