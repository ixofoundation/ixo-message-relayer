import { Body, Controller, HttpException, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TransactionService } from './transaction.service';
import {
  TransactionCreateDto,
  TransactionFetchDto,
  TransactionUpdateDto,
} from './transaction.dto';

@Controller('transaction')
@ApiTags('Transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post('/create')
  createTransactionRequest(@Body() dto: TransactionCreateDto) {
    try {
      return this.transactionService.createTransaction(dto);
    } catch (error) {
      throw new HttpException(error.message, 400);
    }
  }

  @Post('/fetch')
  fetchTransactionRequest(@Body() dto: TransactionFetchDto) {
    try {
      return this.transactionService.fetchTransaction(dto);
    } catch (error) {
      throw new HttpException(error.message, 400);
    }
  }

  @Post('/update')
  updateTransactionRequest(@Body() dto: TransactionUpdateDto) {
    try {
      return this.transactionService.updateTransaction(dto);
    } catch (error) {
      throw new HttpException(error.message, 400);
    }
  }

  @Post('/response')
  responseTransactionRequest(@Body() dto: TransactionFetchDto) {
    try {
      return this.transactionService.responseTransaction(dto);
    } catch (error) {
      throw new HttpException(error.message, 400);
    }
  }
}
