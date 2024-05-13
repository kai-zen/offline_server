import { HttpService } from "@nestjs/axios";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ShippingRangeService } from "src/features/complex/shipping-range/shipping-range.service";
import { toObjectId } from "src/helpers/functions";
import { Injectable } from "@nestjs/common";
import { ComplexUsersFetchService } from "src/features/complex/users/service/complex-user-fetch.service";
import { ComplexUserAddress } from "./user-address.schema";
import { UserService } from "src/features/user/users/user.service";
import { lastValueFrom } from "rxjs";
import { sofreBaseUrl } from "src/helpers/constants";
import { Cron, CronExpression } from "@nestjs/schedule";

@Injectable()
export class ComplexUserAddressService {
  constructor(
    @InjectModel("complex-user-address")
    private readonly model: Model<ComplexUserAddress>,
    private readonly userService: UserService,
    private readonly shippingRangeService: ShippingRangeService,
    private readonly complexUserService: ComplexUsersFetchService,
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

  async updateData() {
    let hasMore = true;
    let page = 1;
    while (hasMore) {
      const res = await lastValueFrom(
        this.httpService.get(
          `${sofreBaseUrl}/complex-user-address/localdb/${process.env.COMPLEX_ID}/${page}`
        )
      );
      if (res.data && res.data.length > 0) {
        for await (const record of res.data) {
          const modifiedResponse = res.data.map((item) => ({
            ...item,
            _id: toObjectId(item._id),
            user: toObjectId(item.user),
            complex: toObjectId(item.complex),
          }));
          await this.model.updateMany(
            { _id: record._id },
            { $set: modifiedResponse },
            { upsert: true }
          );
        }
        ++page;
      } else hasMore = false;
    }
  }

  @Cron(CronExpression.EVERY_6_HOURS, {
    name: "ranges-update-cron",
    timeZone: "Asia/Tehran",
  })
  async handleCron() {
    await this.updateData();
  }
}
