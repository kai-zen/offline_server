import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import helmet from "helmet";
import * as compression from "compression";
import { ValidationPipe } from "@nestjs/common";
import * as fs from "fs";

async function bootstrap() {
  const httpsOptions = {
    key: fs.readFileSync("./src/cert/key.pem"),
    cert: fs.readFileSync("./src/cert/cert.pem"),
  };
  const app = await NestFactory.create(AppModule, { httpsOptions });
  app.enableCors();
  app.use(compression());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false,
    })
  );
  const server = await app.listen(process.env.PORT, "0.0.0.0");
  server.setTimeout(300_000); // 5 minutes
}
bootstrap();
