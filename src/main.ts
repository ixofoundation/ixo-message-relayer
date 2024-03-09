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

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
  });

  // for when behind a reverse proxy such as nginx
  app.set('trust proxy', process.env.TRUST_PROXY || 1);

  app.use(json({ limit: '500mb' }));
  app.use(urlencoded({ limit: '500mb', extended: true }));
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(compression());
  app.use(
    rateLimit({
      windowMs: 1 * 1000,
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

  await app.listen(process.env.PORT || 3000);

  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      maxValueLength: 5000,
      tracesSampleRate: 1.0,
    });
  }
}
bootstrap();
