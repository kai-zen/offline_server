import { HttpService } from "@nestjs/axios";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { escapeRegex, toObjectId } from "src/helpers/functions";
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
    private readonly httpService: HttpService,
    private readonly complexService: ComplexService
  ) {}

  async findAll(queryParams: { [props: string]: string }) {
    const { search = "", limit = "16" } = queryParams || {};

    const cleanedSearch = search ? escapeRegex(search) : "";

    const results = await this.model
      .find(
        cleanedSearch
          ? {
              $or: [
                { name: { $regex: cleanedSearch } },
                { phone_number: { $regex: cleanedSearch } },
                { description: { $regex: cleanedSearch } },
              ],
            }
          : {}
      )
      .limit(parseInt(limit))
      .exec();

    return results;
  }

  async findByUser(user_id: string) {
    return await this.model.find({ user: toObjectId(user_id) }).exec();
  }

  async findById(id: string) {
    return await this.model.findById(id).exec();
  }

  async findByMobile(mobile: string) {
    let user = await this.userService.findByMobile(mobile);
    if (!user) user = await this.userService.createUser(mobile);

    const results = await this.model
      .find({ user: toObjectId(user._id as any) })
      .exec();

    const rates = user.products.map((item) => item.rates).flat(1);
    const totalRates = rates.length || 0;
    const totalPoints = rates.reduce(
      (accumulator, currentVal) => accumulator + currentVal,
      0
    );
    return {
      addresses: results,
      user: {
        image: user.image,
        name: user.name,
        mobile: user.mobile,
        username: user.username,
        _id: user._id,

        orders_quantity: user.orders?.length || 0,
        total_rates: totalRates,
        avg_rate:
          Number(((totalPoints || 0) / (totalRates || 1)).toFixed(1)) || 0,
        complex_user_name: user.name || "",
        complex_user_id: user.complex_user_id || "",
        birthday: user.birthday || null,
        gender: user.gender || 0,
        subscription_number: user.subscription_number || null,
        last_visit: user.last_visit || null,
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
