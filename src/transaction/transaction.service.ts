import { Injectable } from '@nestjs/common';
import {
  TransactionCreateDto,
  TransactionFetchDto,
  TransactionUpdateDto,
} from './transaction.dto';
import { PrismaService } from 'nestjs-prisma';
import { Cron, CronExpression } from '@nestjs/schedule';
import { hashTransactData } from '@ixo/signx-sdk';

@Injectable()
export class TransactionService {
  constructor(private prisma: PrismaService) {}

  async createTransaction(dto: TransactionCreateDto) {
    // validate request
    if (
      !dto.hash ||
      !dto.address ||
      !dto.did ||
      !dto.pubkey ||
      !dto.txBodyHex ||
      !dto.timestamp
    ) {
      return {
        success: false,
        data: {
          message: 'Invalid request, missing parameters',
        },
      };
    }

    const validUntil = new Date(Date.now() + 1000 * 60 * 2); // 2 minutes

    const generatedHash = hashTransactData({
      address: dto.address,
      did: dto.did,
      pubkey: dto.pubkey,
      txBodyHex: dto.txBodyHex,
      timestamp: dto.timestamp,
    });
    if (generatedHash !== dto.hash) {
      return {
        success: false,
        data: {
          message: 'Invalid request',
        },
      };
    }

    const data = {
      address: dto.address,
      did: dto.did,
      pubkey: dto.pubkey,
      txBodyHex: dto.txBodyHex,
      timestamp: dto.timestamp,
      validUntil,
    };

    await this.prisma.transaction.upsert({
      where: { hash: dto.hash },
      create: {
        hash: dto.hash,
        ...data,
        success: false,
      },
      update: data,
    });

    return {
      success: true,
      data: {
        message: 'Transaction request created successfully',
        validUntil,
      },
    };
  }

  async fetchTransaction(dto: TransactionFetchDto) {
    // validate request
    if (!dto.hash) {
      return {
        success: false,
        data: {
          message: 'Invalid request, missing parameters',
        },
      };
    }

    const transaction = await this.prisma.transaction.findUnique({
      where: { hash: dto.hash },
    });
    if (!transaction) {
      return {
        success: false,
        data: {
          message: 'Transaction request not found',
        },
      };
    }
    if (transaction.validUntil < new Date()) {
      return {
        success: false,
        data: {
          message: 'Transaction request expired',
        },
      };
    }
    return {
      success: true,
      data: transaction,
    };
  }

  async updateTransaction(dto: TransactionUpdateDto) {
    // validate request
    if (!dto.hash || !dto.data || typeof dto.success !== 'boolean') {
      return {
        success: false,
        data: {
          message: 'Invalid request, missing parameters',
        },
      };
    }

    const transaction = await this.prisma.transaction.findUnique({
      where: { hash: dto.hash },
    });
    if (!transaction) {
      return {
        success: false,
        data: {
          message: 'Transaction request not found',
        },
      };
    }
    if (transaction.data) {
      return {
        success: false,
        data: {
          message: 'Transaction request already contain data',
        },
      };
    }

    await this.prisma.transaction.update({
      where: { hash: dto.hash },
      data: { data: dto.data, success: dto.success },
    });

    return {
      success: true,
      data: {
        message: 'Transaction request updated successfully',
      },
    };
  }

  async responseTransaction(dto: TransactionFetchDto) {
    // validate request
    if (!dto.hash) {
      return {
        success: false,
        data: {
          message: 'Invalid request, missing parameters',
        },
      };
    }

    const transaction = await this.prisma.transaction.findUnique({
      where: { hash: dto.hash },
    });
    if (!transaction) {
      return {
        success: false,
        data: {
          message: 'Transaction request not found',
        },
      };
    }
    if (!transaction.data) {
      return {
        success: false,
        code: 418,
        data: {
          message: 'Transaction request does not contain data',
        },
      };
    }
    return {
      success: true,
      data: {
        message: 'Transaction request found',
        data: transaction.data,
        success: transaction.success,
      },
    };
  }

  // clear expired transaction requests every 5 minutes
  @Cron(CronExpression.EVERY_5_MINUTES)
  async clearExpiredTransactions() {
    await this.prisma.transaction.deleteMany({
      where: {
        validUntil: {
          lte: new Date(),
        },
      },
    });
  }
}
