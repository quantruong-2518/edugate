import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { Logger } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import fastifyHelmet from "@fastify/helmet";
import fastifyCookie from "@fastify/cookie";

import { AppModule } from "./app.module.js";
import { ApiExceptionFilter } from "./common/api-exception.filter.js";

async function bootstrap(): Promise<void> {
  const adapter = new FastifyAdapter({
    logger: false,
    trustProxy: true,
    genReqId: () => crypto.randomUUID(),
  });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    adapter,
    { bufferLogs: true },
  );

  await app.register(fastifyHelmet, {
    // CSP is handled by Caddy at the edge; helmet here just sets safe defaults.
    contentSecurityPolicy: false,
  });
  await app.register(fastifyCookie);

  // CORS — production rides on the same root domain so we don't need it; in
  // dev the FE runs on :3000 and the API on :3001 so the browser preflight
  // fails without an Access-Control-Allow-Origin header. Allow-list is
  // explicit + reflects the request origin so credentials/cookies still work.
  const corsOrigins = (process.env["CORS_ORIGINS"] ?? "http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "x-tenant-code", "Idempotency-Key", "If-Match"],
    exposedHeaders: ["x-request-id"],
  });

  app.setGlobalPrefix("v1");
  // Validation: we use Zod via per-route pipes (Day 4+) rather than
  // class-validator's ValidationPipe, so the global pipe is left off here.
  app.useGlobalFilters(new ApiExceptionFilter());

  if (process.env["NODE_ENV"] !== "production") {
    const swagger = new DocumentBuilder()
      .setTitle("Ghi Danh API")
      .setDescription("Multi-tenant admission platform — see specs/API_SPEC.md")
      .setVersion("v1")
      .addBearerAuth()
      .build();
    const doc = SwaggerModule.createDocument(app, swagger);
    SwaggerModule.setup("docs", app, doc, { useGlobalPrefix: false });
  }

  const port = Number(process.env["PORT"] ?? 3001);
  const host = process.env["HOST"] ?? "0.0.0.0";
  await app.listen({ port, host });

  Logger.log(`API listening on http://${host}:${port}`, "Bootstrap");
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[bootstrap] failed:", err);
  process.exit(1);
});
