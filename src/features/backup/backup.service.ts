import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";
import * as fs from "fs";
import * as path from "path";
import { ComplexService } from "../complex/complex/comlex.service";
import { messages } from "src/helpers/constants";

@Injectable()
export class BackupService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly complexService: ComplexService
  ) {}

  async backupDatabase() {
    const complex = await this.complexService.findTheComplex();
    if (!complex) throw new NotFoundException(messages[404]);
    if (complex && !complex.backup_route)
      throw new BadRequestException("مسیر ذخیره بک آپ تعیین نشده است.");

    const AdDate = new Date().toISOString().split("T")[0].split(":").join("-");
    const backupDir = path.join(complex.backup_route, AdDate);
    fs.mkdirSync(backupDir, { recursive: true });

    const collections = await this.connection.db.listCollections().toArray();
    for (const collection of collections) {
      const data = await this.connection.db
        .collection(collection.name)
        .find()
        .toArray();
      const filePath = path.join(backupDir, `${collection.name}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }

    console.log("Database backup completed.");
  }
}
