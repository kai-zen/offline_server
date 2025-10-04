import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Model } from "mongoose";
import { OrderDocument } from "../../order.schema";
import { InjectModel } from "@nestjs/mongoose";
import { lastValueFrom } from "rxjs";
import { Cron, CronExpression } from "@nestjs/schedule";
import { HttpService } from "@nestjs/axios";
import { messages, sofreBaseUrl } from "src/helpers/constants";
import { UserService } from "src/features/user/users/user.service";
import { PrinterService } from "src/features/complex/printer/printer.service";
import { ComplexUserAddressService } from "src/features/complex/user-address/user-address.service";
import { toObjectId } from "src/helpers/functions";
import { ComplexService } from "src/features/complex/complex/comlex.service";

const uploadOrdersNetworkError =
  "خطا حین آپلود سفارشات آفلاین رخ داد، اتصال اینترنت خود را بررسی کنید.";

@Injectable()
export class OrderOtherCreateService {
  constructor(
    @InjectModel("order")
    private readonly model: Model<OrderDocument>,
    private readonly userService: UserService,
    private readonly complexUserAddressService: ComplexUserAddressService,
    private readonly printerService: PrinterService,
    private readonly httpService: HttpService,
    private readonly complexService: ComplexService
  ) {}

  async newOrders() {
    return await this.model
      .find({
        is_uploaded: false,
        status: { $lt: 6 },
      })
      .exec();
  }

  async uploadSingleOrder(order_id: string) {
    const theRecord = await this.model.findById(order_id);
    if (!theRecord) throw new NotFoundException(messages[404]);
    else if (theRecord.is_uploaded)
      throw new BadRequestException("سفارش شما قبلا بارگذاری شده است.");

    const complex = await this.complexService.findTheComplex();
    if (!complex) throw new NotFoundException(messages[404]);
    else {
      try {
        const res = await lastValueFrom(
          this.httpService.post(
            `${sofreBaseUrl}/orders/offline`,
            {
              complex_id: complex._id.toString(),
              orders: [theRecord],
            },
            { headers: { "api-key": complex.api_key } }
          )
        );
        if (!res?.data?.failed) {
          theRecord.is_uploaded = true;
          return await theRecord.save();
        } else throw new ForbiddenException(uploadOrdersNetworkError);
      } catch (err) {
        console.log("Upload orders error:", err.response?.data);
        throw new ForbiddenException(uploadOrdersNetworkError);
      }
    }
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
          if (foundedIndex === -1) {
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
    const newOrders = await this.model
      .find({
        is_uploaded: false,
        status: { $lt: 6 },
      })
      .exec();

    let result = {
      success: 0,
      failed: 0,
      failed_ids: [],
      uploaded_printers: false,
      uploaded_users: false,
      uploaded_addresses: false,
    };
    const complex = await this.complexService.findTheComplex();
    if (!complex) throw new NotFoundException(messages[404]);
    try {
      const res = await lastValueFrom(
        this.httpService.post(
          `${sofreBaseUrl}/orders/offline`,
          {
            complex_id: complex._id.toString(),
            orders: newOrders,
          },
          { headers: { "api-key": complex.api_key } }
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
      throw new ForbiddenException(uploadOrdersNetworkError);
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
