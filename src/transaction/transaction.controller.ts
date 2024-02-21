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

  @Post('/create') // for client
  createTransactionRequest(@Body() dto: TransactionCreateDto) {
    try {
      return this.transactionService.createTransaction(dto);
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

  @Post('/update') // for mobile
  updateTransactionRequest(@Body() dto: TransactionUpdateDto) {
    try {
      return this.transactionService.updateTransaction(dto);
    } catch (error) {
      throw new HttpException(error.message, 400);
    }
  }

  @Post('/response') // for client
  responseTransactionRequest(@Body() dto: TransactionFetchDto) {
    try {
      return this.transactionService.responseTransaction(dto);
    } catch (error) {
      throw new HttpException(error.message, 400);
    }
  }
}
