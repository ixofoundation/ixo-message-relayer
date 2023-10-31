import { Injectable } from '@nestjs/common';
import {
  TransactionCreateDto,
  TransactionFetchDto,
  TransactionUpdateDto,
} from './transaction.dto';
import { PrismaService } from 'nestjs-prisma';
import { hashTransactData } from 'src/helpers/encoding';
import { Cron, CronExpression } from '@nestjs/schedule';

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
        message: 'Invalid request, missing parameters',
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
        message: 'Invalid request',
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
      },
      update: data,
    });

    return {
      success: true,
      message: 'Transaction request created successfully',
      validUntil,
    };
  }

  async fetchTransaction(dto: TransactionFetchDto) {
    // validate request
    if (!dto.hash) {
      return {
        success: false,
        message: 'Invalid request, missing parameters',
      };
    }

    const transaction = await this.prisma.transaction.findUnique({
      where: { hash: dto.hash },
    });
    if (!transaction) {
      return {
        success: false,
        message: 'Transaction request not found',
      };
    }
    if (transaction.validUntil < new Date()) {
      return {
        success: false,
        message: 'Transaction request expired',
      };
    }
    return transaction;
  }

  async updateTransaction(dto: TransactionUpdateDto) {
    // validate request
    if (!dto.hash || !dto.response) {
      return {
        success: false,
        message: 'Invalid request, missing parameters',
      };
    }

    const transaction = await this.prisma.transaction.findUnique({
      where: { hash: dto.hash },
    });
    if (!transaction) {
      return {
        success: false,
        message: 'Transaction request not found',
      };
    }
    if (transaction.response) {
      return {
        success: false,
        message: 'Transaction request already contains a response',
      };
    }

    await this.prisma.transaction.update({
      where: { hash: dto.hash },
      data: { response: dto.response },
    });

    return {
      success: true,
      message: 'Transaction request updated successfully',
    };
  }

  async responseTransaction(dto: TransactionFetchDto) {
    // validate request
    if (!dto.hash) {
      return {
        success: false,
        message: 'Invalid request, missing parameters',
      };
    }

    const transaction = await this.prisma.transaction.findUnique({
      where: { hash: dto.hash },
    });
    if (!transaction) {
      return {
        success: false,
        message: 'Transaction request not found',
      };
    }
    if (!transaction.response) {
      return {
        success: false,
        message: 'Transaction request does not contain a response',
        code: 418,
      };
    }
    return transaction.response;
  }

  // clear expired transaction requests every minute
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
