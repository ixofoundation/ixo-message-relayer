import { Body, Controller, HttpException, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TransactionServiceV2 } from './transaction.service_v2';
import {
  TransactionV2CreateDto,
  TransactionFetchDto,
  TransactionV2ResponseDto,
  TransactionV2AddDto,
  TransactionUpdateDto,
} from './transaction.dto';
import { Response } from 'express';

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

  private fetchTrxTimeout = 20000; // 20 seconds timeout
  private fetchTrxPollInterval = 2000; // check every 2 second
  @Post('/fetch') // for mobile
  fetchTransactionRequest(
    @Body() dto: TransactionFetchDto,
    @Res() res: Response,
  ) {
    const startTime = Date.now();
    const poll = async (): Promise<any> => {
      try {
        // Check if the client disconnected before making the next call
        if (res.destroyed) return;

        const result = await this.transactionService.fetchTransaction(dto);
        if (
          result.success || // if success result
          result.code !== 418 || // or if failed result but code is not 418(polling code)
          Date.now() - startTime > this.fetchTrxTimeout // or if timeout
        ) {
          return res.send(result);
        }

        await new Promise((resolve) =>
          setTimeout(resolve, this.fetchTrxPollInterval),
        );
        return poll();
      } catch (error) {
        throw new HttpException(error.message, 400);
      }
    };
    return poll();
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

  private responseTrxTimeout = 20000; // 20 seconds timeout
  private responseTrxPollInterval = 2000; // check every 2 second
  @Post('/response') // for client
  responseTransactionRequest(
    @Body() dto: TransactionV2ResponseDto,
    @Res() res: Response,
  ) {
    const startTime = Date.now();
    const poll = async (): Promise<any> => {
      try {
        // Check if the client disconnected before making the next call
        if (res.destroyed) return;

        const result = await this.transactionService.responseTransaction(dto);
        if (
          result.success || // if success result
          result.code !== 418 || // or if failed result but code is not 418(polling code)
          Date.now() - startTime > this.responseTrxTimeout // or if timeout
        ) {
          return res.send(result);
        }

        await new Promise((resolve) =>
          setTimeout(resolve, this.responseTrxPollInterval),
        );
        return poll();
      } catch (error) {
        throw new HttpException(error.message, 400);
      }
    };
    return poll();
  }

  private sessionNextTimeout = 20000; // 20 seconds timeout
  private sessionNextPollInterval = 2000; // check every 2 second
  @Post('/next') // for client
  sessionNextActive(
    @Body() dto: TransactionV2ResponseDto,
    @Res() res: Response,
  ) {
    const startTime = Date.now();
    const poll = async (): Promise<any> => {
      try {
        // Check if the client disconnected before making the next call
        if (res.destroyed) return;

        const result = await this.transactionService.sessionNextActive(dto);
        if (
          result.success || // if success result
          result.code !== 418 || // or if failed result but code is not 418(polling code)
          Date.now() - startTime > this.sessionNextTimeout // or if timeout
        ) {
          return res.send(result);
        }

        await new Promise((resolve) =>
          setTimeout(resolve, this.sessionNextPollInterval),
        );
        return poll();
      } catch (error) {
        throw new HttpException(error.message, 400);
      }
    };
    return poll();
  }
}
