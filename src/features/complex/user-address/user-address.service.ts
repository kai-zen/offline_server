import { HttpService } from "@nestjs/axios";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ShippingRangeService } from "src/features/complex/shipping-range/shipping-range.service";
import { toObjectId } from "src/helpers/functions";
import { Injectable } from "@nestjs/common";
import { ComplexUserAddress } from "./user-address.schema";
import { UserService } from "src/features/user/users/user.service";
import { lastValueFrom } from "rxjs";
import { sofreBaseUrl } from "src/helpers/constants";
import { ComplexService } from "../complex/comlex.service";

@Injectable()
export class ComplexUserAddressService {
  constructor(
    @InjectModel("complex-user-address")
    private readonly model: Model<ComplexUserAddress>,
    private readonly userService: UserService,
    private readonly shippingRangeService: ShippingRangeService,
    private readonly httpService: HttpService,
    private readonly complexService: ComplexService
  ) {}

  async findAll(complexId: string, queryParams: { [props: string]: string }) {
    const { search = "", limit = "8" } = queryParams || {};
    const results = await this.model
      .find({
        complex: toObjectId(complexId),
        $or: [
          { name: { $regex: search } },
          { phone_number: { $regex: search } },
          { description: { $regex: search } },
        ],
      })
      .limit(parseInt(limit))
      .exec();

    return results;
  }

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
      const theRange =
        latitude && longitude
          ? await this.shippingRangeService.findCorrespondingRange([
              latitude,
              longitude,
            ])
          : null;
      addressesWithShippingPrice.push({
        ...address,
        shipping: theRange ? theRange.price || 0 : "not in range",
      });
    }

    return addressesWithShippingPrice;
  }

  async findById(id: string) {
    return await this.model.findById(id).exec();
  }

  async findByMobile(mobile: string) {
    const user = await this.userService.findByMobile(mobile);

    const results = user
      ? await this.model.find({ user: toObjectId(user._id) }).exec()
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
    phone_number: string;
  }) {
    const {
      name,
      description,
      latitude,
      longitude,
      user_id,
      details,
      phone_number,
    } = data || {};

    const newRecord = new this.model({
      name,
      description,
      user: toObjectId(user_id),
      latitude,
      longitude,
      details,
      phone_number,
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
      phone_number: string;
    }
  ) {
    const { name, description, latitude, longitude, details, phone_number } =
      newData || {};

    const theRecord = await this.model.findById(id);
    if (!theRecord) return;

    theRecord.name = name;
    if (!theRecord.is_copied) theRecord.description = description;
    theRecord.details = details;
    theRecord.latitude = latitude;
    theRecord.longitude = longitude;
    theRecord.phone_number = phone_number;

    return await theRecord.save();
  }

  async deleteOne(id: string) {
    await this.model.deleteOne({ _id: id });
    return "success";
  }

  async updateData() {
    const theComplex = await this.complexService.findTheComplex();
    if (!theComplex) return;
    const timeNumber = theComplex.last_addresses_update
      ? new Date(theComplex.last_addresses_update).getTime()
      : null;

    if (timeNumber) {
      const res = await lastValueFrom(
        this.httpService.get(
          `${sofreBaseUrl}/complex-user-address/localdb/${process.env.COMPLEX_ID}?last_update=${timeNumber}`,
          { headers: { "api-key": process.env.SECRET } }
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
        await this.complexService.updatedAddress();
        return "success";
      }
    } else return await this.updateForFirstTime();
  }

  async updateForFirstTime() {
    let hasMore = true;
    let page = 1;
    while (hasMore) {
      const res = await lastValueFrom(
        this.httpService.get(
          `${sofreBaseUrl}/complex-user-address/localdb/${process.env.COMPLEX_ID}/${page}`,
          { headers: { "api-key": process.env.SECRET } }
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
    await this.complexService.updatedAddress();
    return "success";
  }
}
