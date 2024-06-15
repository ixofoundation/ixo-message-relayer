import { Body, Controller, HttpException, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DataService } from './data.service';
import {
  DataResponseDto,
  DataCreateDto,
  DataUpdateDto,
  DataFetchDto,
} from './data.dto';
import { Response } from 'express';

@Controller('data')
@ApiTags('Data')
export class DataController {
  constructor(private readonly dataService: DataService) {}

  @Post('/create') // for client
  createDataRequest(@Body() dto: DataCreateDto) {
    try {
      return this.dataService.createData(dto);
    } catch (error) {
      throw new HttpException(error.message, 400);
    }
  }

  private fetchLoginTimeout = 10000; // 10 seconds timeout
  private fetchLoginPollInterval = 1500; // check every 1.5 second
  @Post('/response') // for client
  fetchDataResponseRequest(@Body() dto: DataResponseDto, @Res() res: Response) {
    const startTime = Date.now();
    const poll = async (): Promise<any> => {
      try {
        // Check if the client disconnected before making the next call
        if (res.destroyed) return;

        const result = await this.dataService.fetchDataResponse(dto);
        if (
          result.success || // if success result
          result.code !== 418 || // or if failed result but code is not 418(polling code)
          Date.now() - startTime > this.fetchLoginTimeout // or if timeout
        ) {
          return res.send(result);
        }

        await new Promise((resolve) =>
          setTimeout(resolve, this.fetchLoginPollInterval),
        );
        return poll();
      } catch (error) {
        throw new HttpException(error.message, 400);
      }
    };
    return poll();
  }

  @Post('/fetch') // for mobile
  fetchDataRequest(@Body() dto: DataFetchDto) {
    try {
      return this.dataService.fetchData(dto);
    } catch (error) {
      throw new HttpException(error.message, 400);
    }
  }

  @Post('/update') // for mobile
  updateDataRequest(@Body() dto: DataUpdateDto) {
    try {
      return this.dataService.updateData(dto);
    } catch (error) {
      throw new HttpException(error.message, 400);
    }
  }
}
