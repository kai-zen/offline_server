import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import helmet from "helmet";
import * as compression from "compression";
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.use(compression());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false,
    })
  );
  const server = await app.listen("8080", "0.0.0.0");
  server.setTimeout(300_000); // 5 minutes
}
bootstrap();
