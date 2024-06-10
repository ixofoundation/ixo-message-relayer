import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from 'nestjs-prisma';
import { authorization } from './auth.middleware';
import { LoginModule } from './login/login.module';
import { TransactionModule } from './transaction/transaction.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { DataModule } from './data/data.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    LoginModule,
    TransactionModule,
    DataModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(authorization)
      .forRoutes(
        '/login/create',
        '/transaction/fetch',
        '/transaction/update',
        '/transaction/v2/fetch',
        '/transaction/v2/session',
        '/transaction/v2/update',
        '/data/fetch',
        '/data/update',
      );
  }
}
