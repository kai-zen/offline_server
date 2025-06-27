import { InjectModel } from "@nestjs/mongoose";
import { messages, sofreBaseUrl } from "src/helpers/constants";
import { Model } from "mongoose";
import { toObjectId } from "src/helpers/functions";
import { Injectable, NotFoundException } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom } from "rxjs";
import { PrinterDocument, PrinterSettingsDataType } from "./printer.schema";

@Injectable()
export class PrinterService {
  constructor(
    @InjectModel("printer")
    private readonly model: Model<PrinterDocument>,
    private readonly httpService: HttpService
  ) {}

  async findAll() {
    return await this.model
      .find({ needs_delete: { $ne: true } })
      .populate("folders")
      .populate("areas")
      .exec();
  }

  async updateData() {
    const res = await lastValueFrom(
      this.httpService.get(
        `${sofreBaseUrl}/printer/localdb/${process.env.COMPLEX_ID}`,
        {
          headers: {
            "api-key": process.env.SECRET,
          },
        }
      )
    );
    if (res?.data) {
      await this.model.deleteMany({});
      const populated = res.data.map((record) => {
        const areas =
          (record.areas || []).map((a) => toObjectId(a?._id || a)) || [];
        const folders =
          (record.folders || []).map((f) => toObjectId(f?._id || f)) || [];
        const modifiedResponse = {
          ...record,
          folders,
          areas,
          _id: toObjectId(record._id),
          complex: toObjectId(record.complex),
        };
        return modifiedResponse;
      });
      await this.model.insertMany(populated);
      return "success";
    }
  }

  async uploadNeededs() {
    const records = await this.model.find({ needs_upload: true });
    const deleteds = await this.model.find({ needs_delete: true });

    const hasUpdates = Boolean(records && records.length > 0);
    const hasDeletes = Boolean(deleteds && deleteds.length > 0);
    if (hasUpdates || hasDeletes) {
      try {
        await lastValueFrom(
          this.httpService.post(
            `${sofreBaseUrl}/printer/upload_offline`,
            {
              complex_id: process.env.COMPLEX_ID,
              printers: hasUpdates ? records : [],
              deletes: hasDeletes
                ? deleteds.map((record) =>
                    record._id.toString ? record._id.toString() : record._id
                  )
                : [],
            },
            { headers: { "api-key": process.env.SECRET } }
          )
        );
        if (hasUpdates)
          await this.model.updateMany({}, { $set: { needs_upload: false } });
        if (hasDeletes) await this.model.deleteMany({ needs_delete: true });
      } catch (err) {
        console.log(err.response.data);
        return err.response.data;
      }
      return "success";
    }
  }

  async create(
    complex_id: string,
    data: {
      name: string;
      title: string;
      paper_width: string;
      factor_type: number;
      folders: string[];
      areas: string[];
      types: number[];
      is_common: boolean;
      custom_margin: string;
      settings_options: PrinterSettingsDataType | null;
      needs_upload: boolean;
    }
  ) {
    const {
      name,
      factor_type,
      folders,
      is_common,
      paper_width,
      title,
      types,
      areas,
      custom_margin,
      settings_options,
      needs_upload,
    } = data || {};

    const objectIdFolders = Boolean(folders && folders.length > 0)
      ? folders.map((f) => toObjectId(f))
      : null;
    const objectIdAreas = Boolean(areas && areas.length > 0)
      ? areas.map((a) => toObjectId(a))
      : null;
    const newRecord = new this.model({
      name,
      title,
      types,
      folders: objectIdFolders || null,
      areas: objectIdAreas || null,
      factor_type,
      is_common,
      paper_width,
      complex: toObjectId(complex_id),
      custom_margin: custom_margin || null,
      settings_options: settings_options || null,
      needs_upload: Boolean(needs_upload),
    });
    const createResult = await newRecord.save();
    return createResult;
  }

  async edit(data: {
    id: string;
    complex_id: string;
    body: {
      name: string;
      title: string;
      paper_width: string;
      factor_type: number;
      folders: string[];
      areas: string[];
      types: number[];
      is_common: boolean;
      custom_margin: string;
      settings_options: PrinterSettingsDataType | null;
      needs_upload: boolean;
    };
  }) {
    const { id, body, complex_id } = data || {};
    const {
      factor_type,
      folders,
      is_common,
      name,
      paper_width,
      types,
      title,
      areas,
      custom_margin,
      settings_options,
      needs_upload,
    } = body || {};
    const objectIdFolders = Boolean(folders && folders.length > 0)
      ? folders.map((f) => toObjectId(f))
      : null;
    const objectIdAreas = Boolean(areas && areas.length > 0)
      ? areas.map((a) => toObjectId(a))
      : null;

    const theRecord = await this.model.findOne({
      _id: toObjectId(id),
      complex: toObjectId(complex_id),
    });
    if (!theRecord) throw new NotFoundException(messages[404]);

    theRecord.factor_type = factor_type; // @ts-ignore
    theRecord.folders = objectIdFolders || []; // @ts-ignore
    theRecord.areas = objectIdAreas;
    theRecord.is_common = Boolean(is_common);
    theRecord.name = name;
    theRecord.paper_width = paper_width;
    theRecord.types = types || [1, 2, 3];
    theRecord.title = title;
    theRecord.custom_margin = custom_margin || null;
    theRecord.settings_options = settings_options || null;
    theRecord.needs_upload = Boolean(needs_upload);

    return await theRecord.save();
  }

  async deleteOne(id: string, needs_upload_delete: boolean) {
    const theRecord = await this.model.findOne({
      _id: toObjectId(id),
    });
    if (!theRecord) return;

    if (needs_upload_delete) {
      theRecord.needs_delete = true;
      await theRecord.save();
    } else {
      await this.model.deleteOne({
        _id: toObjectId(id),
      });
    }

    return "success";
  }
}
