import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { TransactionServiceV2 } from './transaction.service_v2';
import { TransactionControllerV2 } from './transaction.controller_v2';

@Module({
  controllers: [TransactionController, TransactionControllerV2],
  providers: [TransactionService, TransactionServiceV2],
})
export class TransactionModule {}
