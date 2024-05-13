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
