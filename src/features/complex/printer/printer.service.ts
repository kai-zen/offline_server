import { InjectModel } from "@nestjs/mongoose";
import { messages, sofreBaseUrl } from "src/helpers/constants";
import { Model } from "mongoose";
import { toObjectId } from "src/helpers/functions";
import { Injectable, NotFoundException } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom } from "rxjs";
import { PrinterDocument } from "./printer.schema";

@Injectable()
export class PrinterService {
  constructor(
    @InjectModel("printer")
    private readonly model: Model<PrinterDocument>,
    private readonly httpService: HttpService
  ) {}

  async findAll() {
    return await this.model.find().populate("folders").populate("areas").exec();
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

    return await theRecord.save();
  }

  async deleteOne(id: string) {
    const theRecord = await this.model.findOne({
      _id: toObjectId(id),
    });
    if (!theRecord) return;

    await this.model.deleteOne({
      _id: toObjectId(id),
    });
    return "success";
  }
}
