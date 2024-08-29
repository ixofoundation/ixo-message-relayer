import { Injectable } from '@nestjs/common';
import { MatrixLoginFetchDto, MatrixLoginCreateDto } from './matrix.dto';
import { PrismaService } from 'nestjs-prisma';
import { Cron, CronExpression } from '@nestjs/schedule';
import { generateSecureHash } from '@ixo/signx-sdk';
import { returnError, returnSuccess } from 'src/utils';

@Injectable()
export class MatrixService {
  constructor(private prisma: PrismaService) {}

  async createMatrixLogin(dto: MatrixLoginCreateDto) {
    // validate request
    if (
      !dto.hash ||
      !dto.secureHash ||
      !dto.data ||
      typeof dto.success !== 'boolean'
    ) {
      return returnError('Invalid request, missing parameters');
    }

    const validUntil = new Date(Date.now() + 1000 * 60 * 2); // 2 minutes

    await this.prisma.login.upsert({
      where: { hash: dto.hash },
      create: {
        hash: dto.hash,
        secureHash: dto.secureHash,
        data: dto.data,
        validUntil,
        success: dto.success,
      },
      update: {
        secureHash: dto.secureHash,
        data: dto.data,
        validUntil,
        success: dto.success,
      },
    });

    return returnSuccess({
      message: 'Matrix login request created successfully',
    });
  }

  async fetchMatrixLogin(dto: MatrixLoginFetchDto): Promise<any> {
    // validate request
    if (!dto.hash || !dto.secureNonce) {
      return returnError('Invalid request, missing parameters');
    }

    const login = await this.prisma.login.findUnique({
      where: { hash: dto.hash },
    });
    if (!login) {
      return returnError('Matrix login request not found', 418); // 418 I'm a teapot, for sdk to know to keep polling
    }

    // validate request
    const secureHash = generateSecureHash(dto.hash, dto.secureNonce);
    if (login.secureHash !== secureHash) {
      return returnError('Invalid request, hash mismatch');
    }
    if (login.validUntil < new Date()) {
      return returnError('Matrix login request expired');
    }

    // remove login request after fetching
    await this.prisma.login.delete({ where: { hash: dto.hash } });

    return returnSuccess({
      message: 'Matrix login request fetched successfully',
      data: login.data,
      success: login.success,
    });
  }

  // clear expired login requests every minute
  @Cron(CronExpression.EVERY_5_MINUTES)
  async clearExpiredLogins() {
    await this.prisma.login.deleteMany({
      where: {
        validUntil: {
          lte: new Date(),
        },
      },
    });
  }
}
