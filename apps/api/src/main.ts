import 'dotenv/config';
import 'reflect-metadata';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const configuredOrigins = process.env.CORS_ORIGINS;

  const allowedOrigins =
    configuredOrigins === undefined
      ? nodeEnv === 'development'
        ? ['http://localhost:3001']
        : []
      : configuredOrigins
          .split(',')
          .map((origin) => origin.trim())
          .filter((origin) => origin.length > 0);

  if (allowedOrigins.some((origin) => origin.includes('*'))) {
    throw new Error('CORS_ORIGINS must not contain wildcard origins.');
  }

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 3000);

  await app.listen(port);

  console.log(`BRX EduNexa API listening on port ${port}`);
}

void bootstrap();
