import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { BackupService } from "./backup.service";

@Module({
  imports: [
    MongooseModule.forRoot("mongodb://localhost:27017/YOUR_DATABASE_NAME"), // Replace with your MongoDB URI
  ],
  providers: [BackupService],
  exports: [BackupService],
})
export class BackupModule {}
