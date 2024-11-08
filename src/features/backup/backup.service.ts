import { Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class BackupService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async backupDatabase() {
    const AdDate = new Date().toISOString().split("T")[0].split(":").join("-");
    const backupDir = path.join(process.env.BACKUP_ROUTE, AdDate);
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
