import { ForbiddenException, Injectable } from "@nestjs/common";
import { Model } from "mongoose";
import { OrderDocument } from "../../order.schema";
import { InjectModel } from "@nestjs/mongoose";
import { lastValueFrom } from "rxjs";
import { Cron, CronExpression } from "@nestjs/schedule";
import { HttpService } from "@nestjs/axios";
import { sofreBaseUrl } from "src/helpers/constants";
import { UserService } from "src/features/user/users/user.service";
import { PrinterService } from "src/features/complex/printer/printer.service";
import { ComplexUserAddressService } from "src/features/complex/user-address/user-address.service";
import { toObjectId } from "src/helpers/functions";

@Injectable()
export class OrderOtherCreateService {
  constructor(
    @InjectModel("order")
    private readonly model: Model<OrderDocument>,
    private readonly userService: UserService,
    private readonly complexUserAddressService: ComplexUserAddressService,
    private readonly printerService: PrinterService,
    private readonly httpService: HttpService
  ) {}

  async newOrders() {
    return await this.model
      .find({
        is_uploaded: false,
        status: { $lt: 6 },
      })
      .exec();
  }

  async updatedOrders(failedIds: string[]) {
    if (failedIds?.length) {
      const notUploaded = await this.model.find({
        is_uploaded: false,
        status: { $lt: 6 },
      });
      if (notUploaded?.length) {
        for await (const notUploadedOrder of notUploaded) {
          const foundedIndex = failedIds.findIndex((failedId) =>
            notUploadedOrder?._id?.equals(toObjectId(failedId))
          );
          if (foundedIndex !== -1) {
            notUploadedOrder.is_uploaded = true;
            await notUploadedOrder.save();
          }
        }
      } else {
        await this.model.updateMany(
          { is_uploaded: false },
          { $set: { is_uploaded: true } }
        );
      }
    } else {
      await this.model.updateMany(
        { is_uploaded: false },
        { $set: { is_uploaded: true } }
      );
    }
  }

  async uploadOrders() {
    const newOrders = await this.newOrders();
    let result = {
      success: 0,
      failed: 0,
      failed_ids: [],
      uploaded_printers: false,
      uploaded_users: false,
      uploaded_addresses: false,
    };
    try {
      const res = await lastValueFrom(
        this.httpService.post(
          `${sofreBaseUrl}/orders/offline`,
          {
            complex_id: process.env.COMPLEX_ID,
            orders: newOrders,
          },
          { headers: { "api-key": process.env.SECRET } }
        )
      );
      const uploadData: {
        success: number;
        failed: number;
        failed_ids: string[];
      } = res?.data;
      const failedIds = Array.isArray(uploadData?.failed_ids)
        ? uploadData?.failed_ids || []
        : [];

      result = {
        ...result,
        success: uploadData.success,
        failed: failedIds.length,
        failed_ids: failedIds,
      };
      await this.updatedOrders(failedIds);
    } catch (err) {
      console.log("Upload orders error:", err.response?.data);
      throw new ForbiddenException(
        "خطا حین آپلود سفارشات آفلاین رخ داد، اتصال اینترنت خود را بررسی کنید."
      );
    }

    // upload other data
    try {
      await this.printerService.uploadNeededs();
      result = { ...result, uploaded_printers: true };
    } catch (err) {
      console.log("Printer upload error:", err);
    }
    try {
      await this.complexUserAddressService.uploadNeededs();
      result = { ...result, uploaded_addresses: true };
    } catch (err) {
      console.log("Printer upload error:", err);
    }
    try {
      await this.userService.uploadNeededs();
      result = { ...result, uploaded_users: true };
    } catch (err) {
      console.log("Printer upload error:", err);
    }
    return result;
  }

  @Cron(CronExpression.EVERY_2_HOURS, {
    name: "complex-activation-cron",
    timeZone: "Asia/Tehran",
  })
  async handleCron() {
    await this.uploadOrders();
  }
}
