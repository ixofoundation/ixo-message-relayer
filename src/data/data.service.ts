import { Injectable } from '@nestjs/common';
import {
  DataResponseDto,
  DataCreateDto,
  DataUpdateDto,
  DataFetchDto,
} from './data.dto';
import { PrismaService } from 'nestjs-prisma';
import { Cron, CronExpression } from '@nestjs/schedule';
import { generateSecureHash } from '@ixo/signx-sdk';
import { returnError, returnSuccess } from 'src/utils';

@Injectable()
export class DataService {
  constructor(private prisma: PrismaService) {}

  async createData(dto: DataCreateDto) {
    // validate request
    if (!dto.hash || !dto.data || !dto.type) {
      return returnError('Invalid request, missing parameters');
    }

    const validUntil = new Date(Date.now() + 1000 * 60 * 2); // 2 minutes

    await this.prisma.data.upsert({
      where: { hash: dto.hash },
      create: {
        hash: dto.hash,
        data: dto.data,
        type: dto.type,
        validUntil,
      },
      update: {
        data: dto.data,
        type: dto.type,
        validUntil,
      },
    });

    return returnSuccess({
      message: 'Login request created successfully',
    });
  }

  async fetchDataResponse(dto: DataResponseDto): Promise<any> {
    // validate request
    if (!dto.hash || !dto.secureNonce) {
      return returnError('Invalid request, missing parameters');
    }

    const data = await this.prisma.data.findUnique({
      where: { hash: dto.hash },
    });
    if (!data) {
      return returnError('Data not found');
    }
    if (data.validUntil < new Date()) {
      return returnError('Data expired');
    }
    if (!data.secureHash) {
      return returnError('No Data response yet', 418); // 418 I'm a teapot, for sdk to know to keep polling
    }

    // validate secureHash
    const secureHash = generateSecureHash(dto.hash, dto.secureNonce);
    if (data.secureHash !== secureHash) {
      return returnError('Invalid request, hash mismatch');
    }

    // remove data after fetching
    await this.prisma.data.delete({ where: { hash: dto.hash } });

    return returnSuccess({
      message: 'Data response fetched successfully',
      response: data.response,
      success: data.success,
    });
  }

  async fetchData(dto: DataFetchDto) {
    // validate request
    if (!dto.hash) {
      return returnError('Invalid request, missing parameters');
    }

    const data = await this.prisma.data.findUnique({
      where: { hash: dto.hash },
    });
    if (!data) {
      return returnError('Data not found');
    }
    if (data.validUntil < new Date()) {
      return returnError('Data expired');
    }

    return returnSuccess({
      data: data.data,
      type: data.type,
    });
  }

  async updateData(dto: DataUpdateDto) {
    // validate request
    if (!dto.hash || !dto.secureHash || !dto.success || !dto.response) {
      return returnError('Invalid request, missing parameters');
    }

    const data = await this.prisma.data.findUnique({
      where: { hash: dto.hash },
    });
    if (!data) {
      return returnError('Data not found');
    }
    if (data.validUntil < new Date()) {
      return returnError('Data expired');
    }

    // update data with response
    await this.prisma.data.update({
      where: { hash: dto.hash },
      data: {
        secureHash: dto.secureHash,
        success: dto.success,
        response: dto.response,
      },
    });

    return returnSuccess({
      message: 'Data updated successfully',
    });
  }

  // clear expired data every 5 minutes
  @Cron(CronExpression.EVERY_5_MINUTES)
  async clearExpiredData() {
    await this.prisma.data.deleteMany({
      where: {
        validUntil: {
          lte: new Date(),
        },
      },
    });
  }
}
