import { Body, Controller, HttpException, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TransactionServiceV2 } from './transaction.service_v2';
import {
  TransactionV2CreateDto,
  TransactionFetchDto,
  TransactionV2ResponseDto,
  TransactionV2AddDto,
  TransactionUpdateDto,
} from './transaction.dto';

@Controller('transaction/v2/')
@ApiTags('Transaction V2')
export class TransactionControllerV2 {
  constructor(private readonly transactionService: TransactionServiceV2) {}

  @Post('/create') // for client
  createTransactionRequest(@Body() dto: TransactionV2CreateDto) {
    try {
      return this.transactionService.createTransaction(dto);
    } catch (error) {
      throw new HttpException(error.message, 400);
    }
  }

  @Post('/add') // for client
  addTransactionRequest(@Body() dto: TransactionV2AddDto) {
    try {
      return this.transactionService.addTransaction(dto);
    } catch (error) {
      throw new HttpException(error.message, 400);
    }
  }

  @Post('/fetch') // for mobile
  fetchTransactionRequest(@Body() dto: TransactionFetchDto) {
    try {
      return this.transactionService.fetchTransaction(dto);
    } catch (error) {
      throw new HttpException(error.message, 400);
    }
  }

  @Post('/session') // for mobile
  fetchTransactionSession(@Body() dto: TransactionFetchDto) {
    try {
      return this.transactionService.fetchSession(dto);
    } catch (error) {
      throw new HttpException(error.message, 400);
    }
  }

  @Post('/update') // for mobile
  updateTransactionRequest(@Body() dto: TransactionUpdateDto) {
    try {
      return this.transactionService.updateTransaction(dto);
    } catch (error) {
      throw new HttpException(error.message, 400);
    }
  }

  @Post('/response') // for client
  responseTransactionRequest(@Body() dto: TransactionV2ResponseDto) {
    try {
      return this.transactionService.responseTransaction(dto);
    } catch (error) {
      throw new HttpException(error.message, 400);
    }
  }

  @Post('/next') // for client
  sessionNextActive(@Body() dto: TransactionV2ResponseDto) {
    try {
      return this.transactionService.sessionNextActive(dto);
    } catch (error) {
      throw new HttpException(error.message, 400);
    }
  }
}
