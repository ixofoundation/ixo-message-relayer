import { Injectable } from '@nestjs/common';
import {
  TransactionCreateDto,
  TransactionFetchDto,
  TransactionUpdateDto,
} from './transaction.dto';
import { PrismaService } from 'nestjs-prisma';
import { Cron, CronExpression } from '@nestjs/schedule';
import { returnError, returnSuccess } from 'src/utils';
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
      return returnError('Invalid request, missing parameters');
    }

    const validUntil = new Date(Date.now() + 1000 * 60 * 2); // 2 minutes

    const generatedHash = hashTransactData(
      {
        address: dto.address,
        did: dto.did,
        pubkey: dto.pubkey,
        txBodyHex: dto.txBodyHex,
        timestamp: dto.timestamp,
      },
      false,
    );
    if (generatedHash !== dto.hash) {
      return returnError('Invalid request, hash mismatch');
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

    return returnSuccess({
      message: 'Transaction request created successfully',
      validUntil,
    });
  }

  async fetchTransaction(dto: TransactionFetchDto) {
    // validate request
    if (!dto.hash) {
      return returnError('Invalid request, missing parameters');
    }

    const transaction = await this.prisma.transaction.findUnique({
      where: { hash: dto.hash },
    });
    if (!transaction) {
      return returnError('Transaction request not found');
    }
    if (transaction.validUntil < new Date()) {
      return returnError('Transaction request expired');
    }
    return returnSuccess(transaction);
  }

  async updateTransaction(dto: TransactionUpdateDto) {
    // validate request
    if (!dto.hash || !dto.data || typeof dto.success !== 'boolean') {
      return returnError('Invalid request, missing parameters');
    }

    const transaction = await this.prisma.transaction.findUnique({
      where: { hash: dto.hash },
    });
    if (!transaction) {
      return returnError('Transaction request not found');
    }
    if (transaction.data) {
      return returnError('Transaction request already contain data');
    }

    await this.prisma.transaction.update({
      where: { hash: dto.hash },
      data: { data: dto.data, success: dto.success },
    });

    return returnSuccess({
      message: 'Transaction request updated successfully',
    });
  }

  async responseTransaction(dto: TransactionFetchDto) {
    // validate request
    if (!dto.hash) {
      return returnError('Invalid request, missing parameters');
    }

    const transaction = await this.prisma.transaction.findUnique({
      where: { hash: dto.hash },
    });
    if (!transaction) {
      return returnError('Transaction request not found');
    }
    if (!transaction.data) {
      return returnError('Transaction request does not contain data', 418); // 418 I'm a teapot, for sdk to know to keep polling
    }
    return returnSuccess({
      message: 'Transaction request found',
      data: transaction.data,
      success: transaction.success,
    });
  }

  // clear expired transaction requests every 5 minutes
  @Cron(CronExpression.EVERY_MINUTE)
  async clearExpiredTransactions() {
    const nowSub2Minutes = new Date(Date.now() - 1000 * 60 * 2); // 2 minutes subtracted to current time for leaway gap
    await this.prisma.transaction.deleteMany({
      where: {
        validUntil: {
          lte: nowSub2Minutes,
        },
      },
    });
  }
}
