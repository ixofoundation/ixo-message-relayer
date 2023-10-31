import { Injectable } from '@nestjs/common';
import { LoginFetchDto, LoginCreateDto } from './login.dto';
import { PrismaService } from 'nestjs-prisma';
import { generateSecureHash } from 'src/helpers/encoding';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class LoginService {
  constructor(private prisma: PrismaService) {}

  async createLogin(dto: LoginCreateDto) {
    // validate request
    if (!dto.hash || !dto.secureHash || !dto.data) {
      return {
        success: false,
        message: 'Invalid request, missing parameters',
      };
    }

    const validUntil = new Date(Date.now() + 1000 * 60 * 2); // 2 minutes

    await this.prisma.login.upsert({
      where: { hash: dto.hash },
      create: {
        hash: dto.hash,
        secureHash: dto.secureHash,
        data: dto.data,
        validUntil,
      },
      update: {
        secureHash: dto.secureHash,
        data: dto.data,
        validUntil,
      },
    });

    return {
      success: true,
      message: 'Login request created successfully',
      validUntil,
    };
  }

  async fetchLogin(dto: LoginFetchDto) {
    // validate request
    if (!dto.hash || !dto.secureNonce) {
      return {
        success: false,
        message: 'Invalid request, missing parameters',
      };
    }

    const login = await this.prisma.login.findUnique({
      where: { hash: dto.hash },
    });
    if (!login) {
      return {
        success: false,
        message: 'Login request not found',
        code: 418,
      };
    }

    // validate request
    const secureHash = generateSecureHash(dto.hash, dto.secureNonce);
    if (login.secureHash !== secureHash) {
      return {
        success: false,
        message: 'Invalid request',
      };
    }
    if (login.validUntil < new Date()) {
      return {
        success: false,
        message: 'Login request expired',
      };
    }

    // remove login request after fetching
    await this.prisma.login.delete({ where: { hash: dto.hash } });

    return login.data;
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
