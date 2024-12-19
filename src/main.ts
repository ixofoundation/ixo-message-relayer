import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { urlencoded, json } from 'express';
import { AppModule } from './app.module';
import * as Sentry from '@sentry/node';
import '@sentry/tracing';
import { NestExpressApplication } from '@nestjs/platform-express';
import compression from 'compression';
import { ErrorLoggingInterceptor } from './interceptors/logging';
import { postgresMigrate } from './postgres/migrations';
import {
  MIGRATE_DB_PROGRAMATICALLY,
  DATABASE_URL,
  TRUST_PROXY,
  PORT,
  SENTRY_DSN,
} from './utils/secrets';

async function bootstrap() {
  // first apply db migrations if env var set, for prod dbs where no access to shell
  if (MIGRATE_DB_PROGRAMATICALLY) {
    console.log('MIGRATE_DB_PROGRAMATICALLY: ', MIGRATE_DB_PROGRAMATICALLY);
    await postgresMigrate(DATABASE_URL || '');
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
  });
  app.useGlobalInterceptors(new ErrorLoggingInterceptor());

  // for when behind a reverse proxy such as nginx
  app.set('trust proxy', TRUST_PROXY);

  app.use(json({ limit: '500mb' }));
  app.use(urlencoded({ limit: '500mb', extended: true }));
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(compression());
  app.use(
    rateLimit({
      windowMs: 1 * 1000, // 1 second
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message:
        'Too many requests from this IP, please try again after 1 second',
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('ixo-message-relayer')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
    })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  await app.listen(PORT);

  if (SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,
      maxValueLength: 5000,
      tracesSampleRate: 1.0,
    });
  }
}
bootstrap();
