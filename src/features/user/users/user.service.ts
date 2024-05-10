import {
  deleteFile,
  generate5digitCode,
  toObjectId,
} from "src/helpers/functions";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { kavenegarApi, messages } from "src/helpers/constants";
import { Model, Types } from "mongoose";
import { UserDocument } from "./user.schema";
import {
  userOrderGroup,
  userOrderProject,
} from "src/features/order/order/helpers/aggregate-constants";

@Injectable()
export class UserService {
  constructor(
    @InjectModel("user") private readonly model: Model<UserDocument>
  ) {}

  async findAll(queryParams: { [props: string]: string }) {
    const {
      search = "",
      limit = "12",
      page = "1",
      sort,
      direction = "asc",
    } = queryParams || {};

    const sortObj = {};
    if (sort) sortObj[sort] = direction === "asc" ? -1 : 1;
    const searchRegex = new RegExp(`^${search}`, "i");

    const filters = {
      $or: [
        { name: searchRegex },
        { username: searchRegex },
        { mobile: searchRegex },
      ],
    };
    const results = await this.model
      .find(filters)
      .sort(sortObj)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .exec();

    const totalDocuments = await this.model
      .find(filters)
      .countDocuments()
      .exec();
    const numberOfPages = Math.ceil(totalDocuments / parseInt(limit));

    return {
      items: results,
      numberOfPages,
    };
  }

  async findById(id: string | Types.ObjectId) {
    return await this.model.findById(id);
  }

  async setLoginCode(user_id: string | Types.ObjectId, shouldReset?: boolean) {
    const theUser = await this.model.findById(user_id);

    if (!shouldReset) {
      const twoMinutesAgo = new Date(new Date().getTime() - 2 * 60_000);
      if (theUser.last_dto > twoMinutesAgo)
        throw new BadRequestException("برای ورود مجدد دو دقیقه صبر کنید.");
      const code = generate5digitCode();
      theUser.auth_code = code;
      kavenegarApi.VerifyLookup(
        {
          receptor: theUser.mobile,
          token: code,
          template: "verifylogin",
        },
        (response: any, status: any) => {
          console.log(response, status);
        }
      );
    } else theUser.auth_code = "";
    return await theUser.save();
  }

  async userFullData(id: string) {
    const [theResult] = await this.model.aggregate([
      { $match: { _id: toObjectId(id) } },
      { $limit: 1 },
      {
        $lookup: {
          from: "orders",
          as: "active_orders",
          let: { user_id: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$user", "$$user_id"] },
                    { $in: ["$status", [1, 2, 3, 4]] },
                  ],
                },
              },
            },
            { $unwind: "$products" },
            {
              $lookup: {
                from: "products",
                localField: "products.product",
                foreignField: "_id",
                as: "product_details",
              },
            },
            { $unwind: "$product_details" },
            { $project: userOrderProject },
            { $group: userOrderGroup },
          ],
        },
      },
      {
        $lookup: {
          from: "reservation-requests",
          as: "active_reservations",
          let: { user_id: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$user", "$$user_id"] },
                    { $eq: ["$status", 1] },
                  ],
                },
              },
            },
          ],
        },
      },
      { $project: { auth_code: 0 } },
    ]);
    return theResult;
  }

  async updateStats(userId: string | Types.ObjectId, cost: number) {
    const theUser = await this.model.findById(userId);
    if (!theUser) throw new NotFoundException(messages[404]);
    theUser.total_orders = (theUser.total_orders || 0) + 1;
    theUser.total_points =
      (theUser.total_orders || 0) + Math.ceil(cost / 100_000);
    return await theUser.save();
  }

  async findByMobile(mobile: string) {
    return await this.model.findOne({ mobile });
  }

  async findByUsername(username: string) {
    return await this.model.exists({ username });
  }

  async createUser(mobile: string) {
    const newRecord = new this.model({ mobile });
    return await newRecord.save();
  }

  async updateProfile(
    user_id: string,
    data: {
      name: string;
      username: string;
      file: string;
      bio: string;
      birthday: Date;
      email: string;
    }
  ) {
    const { name, username, birthday, bio, file, email } = data;
    const theRecord = await this.model.findById(user_id);
    if (!theRecord) throw new NotFoundException();

    if (file) {
      if (theRecord.image) deleteFile(theRecord.image);
      theRecord.image = file;
    }
    if (name) theRecord.name = name;
    if (bio) theRecord.bio = bio;
    if (username && username !== theRecord.username)
      theRecord.username = username;
    if (birthday) theRecord.birthday = birthday;
    if (email) theRecord.email = email;
    return await theRecord.save();
  }
}
