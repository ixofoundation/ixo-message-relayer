import { Body, Controller, HttpException, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MatrixService } from './matrix.service';
import { MatrixLoginFetchDto, MatrixLoginCreateDto } from './matrix.dto';
import { Response } from 'express';

@Controller('matrix')
@ApiTags('Matrix')
export class MatrixController {
  constructor(private readonly matrixService: MatrixService) {}

  @Post('/login/create') // for mobile
  createMatrixLoginRequest(@Body() dto: MatrixLoginCreateDto) {
    try {
      return this.matrixService.createMatrixLogin(dto);
    } catch (error) {
      throw new HttpException(error.message, 400);
    }
  }

  private fetchLoginTimeout = 10000; // 12 seconds timeout
  private fetchLoginPollInterval = 1500; // check every 1.5 second
  @Post('/login/fetch') // for client
  fetchMatrixLoginRequest(
    @Body() dto: MatrixLoginFetchDto,
    @Res() res: Response,
  ) {
    const startTime = Date.now();
    const poll = async (): Promise<any> => {
      try {
        // Check if the client disconnected before making the next call
        if (res.destroyed) return;

        const result = await this.matrixService.fetchMatrixLogin(dto);
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
}
