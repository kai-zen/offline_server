import { Process, Processor } from "@nestjs/bull";
import { InjectModel } from "@nestjs/mongoose";
import { Job } from "bull";
import { Model } from "mongoose";
import { ComplexUserDocument } from "./complex-users.schema";
import { MessageService } from "src/features/management/messages/message.service";

@Processor("give_discount")
export class GiveDiscountProcessor {
  constructor(
    @InjectModel("complex-user")
    private readonly model: Model<ComplexUserDocument>,
    private readonly messageService: MessageService
  ) {}

  @Process()
  async handleGiveDiscount(job: Job) {
    const { users, complex_id, message } = job.data;
    const sendingMessages: {
      _id: string;
      message: string;
      mobile: string;
    }[] = [];
    for await (const user of users) {
      const theComplexUser = await this.model
        .findOne({
          complex: complex_id,
          _id: user._id,
        })
        .populate("user", "mobile")
        .lean()
        .exec();
      if (theComplexUser?.user?.mobile)
        sendingMessages.push({
          ...user,
          mobile: theComplexUser.user.mobile,
        });
    }

    await this.messageService.create({
      complex_id,
      message,
      users: sendingMessages,
    });
    return "success";
  }
}
