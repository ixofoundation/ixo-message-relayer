import { Injectable } from '@nestjs/common';
import {
  TransactionV2AddDto,
  TransactionV2CreateDto,
  TransactionFetchDto,
  TransactionV2ResponseDto,
  TransactionUpdateDto,
} from './transaction.dto';
import { PrismaService } from 'nestjs-prisma';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  createAddTransaction,
  returnError,
  returnSuccess,
  CreateAddTransactionReturn,
} from 'src/utils';
import { generateSecureHash } from '@ixo/signx-sdk';

@Injectable()
export class TransactionServiceV2 {
  constructor(private prisma: PrismaService) {}

  async createTransaction(dto: TransactionV2CreateDto) {
    // validate request
    if (
      !dto.hash ||
      !dto.address ||
      !dto.did ||
      !dto.pubkey ||
      !dto.transactions.secureNonce ||
      !dto.transactions.transactions
    ) {
      return returnError('Invalid request, missing parameters');
    }

    // validate transactions, that is an array of less than 100 items
    if (
      !Array.isArray(dto.transactions.transactions) ||
      dto.transactions.transactions.length === 0 ||
      dto.transactions.transactions.length >= 100
    ) {
      return returnError(
        'Invalid request, transactions must be an array between 1 and 99 items',
      );
    }

    // order transactions by sequence and get prisma transaction object
    let transactions: CreateAddTransactionReturn[] = [];
    try {
      dto.transactions.transactions
        .sort((a, b) => a.sequence ?? 99 - b.sequence ?? 99)
        .forEach((trx, index) => {
          transactions.push(
            createAddTransaction(
              {
                address: dto.address,
                did: dto.did,
                pubkey: dto.pubkey,
              },
              trx,
              index + 1, // sequence starts at 1
            ),
          );
        });
    } catch (error) {
      return returnError(error.message);
    }

    // validate session hash with secureNonce, to ensure user have the correct secureNonce and correct hash was generated
    const secureHash = generateSecureHash(
      transactions[0].hash,
      dto.transactions.secureNonce,
    );
    if (dto.hash !== secureHash) {
      return returnError('Invalid request, hash mismatch');
    }

    // set first transaction as active and valid for 2 minutes
    const validUntil = new Date(Date.now() + 1000 * 60 * 2); // 2 minutes
    // @ts-ignore
    transactions[0].validUntil = validUntil;
    // @ts-ignore
    transactions[0].active = true;

    await this.prisma.transactionsSessionV2.create({
      data: {
        hash: dto.hash,
        address: dto.address,
        did: dto.did,
        pubkey: dto.pubkey,
        validUntil,
        transactions: {
          createMany: {
            data: transactions,
          },
        },
      },
    });

    return returnSuccess({
      message: 'Transactions session created successfully',
      activeTransaction: {
        hash: transactions[0].hash,
        sequence: transactions[0].sequence,
        // @ts-ignore
        validUntil: transactions[0].validUntil,
      },
    });
  }

  async addTransaction(dto: TransactionV2AddDto) {
    // validate request
    if (!dto.hash || !dto.secureNonce || !dto.transactions) {
      return returnError('Invalid request, missing parameters');
    }

    // validate transactions, that is an array of less than 100 items
    if (
      !Array.isArray(dto.transactions) ||
      dto.transactions.length === 0 ||
      dto.transactions.length >= 100
    ) {
      return returnError(
        'Invalid request, transactions must be an array between 1 and 99 items',
      );
    }

    // get prisma transaction session object
    const session = await this.prisma.transactionsSessionV2.findUnique({
      where: { hash: dto.hash },
      include: { transactions: true },
    });

    if (!session) {
      return returnError('Transactions session not found');
    }
    if (session.validUntil < new Date()) {
      return returnError('Transactions session expired');
    }
    if (session.transactions.length + dto.transactions.length >= 100) {
      return returnError(
        'Transactions session full, session can only contain 99 transactions, and it already contains ' +
          session.transactions.length,
      );
    }

    // validate session hash with secureNonce, to ensure user have the correct secureNonce and correct hash was generated
    const secureHash = generateSecureHash(
      session.transactions.find((t) => t.sequence === 1)?.hash ?? '',
      dto.secureNonce,
    );
    if (session.hash !== secureHash) {
      return returnError('Invalid request, hash mismatch');
    }

    // get last transaction in sequence
    const lastTrxInSequence = session.transactions.sort(
      (a, b) => b.sequence - a.sequence,
    )[0];
    const lastTrxDone = !!lastTrxInSequence.data;

    // order transactions by sequence and get prisma transaction object
    let transactions: CreateAddTransactionReturn[] = [];
    try {
      dto.transactions
        .sort((a, b) => a.sequence ?? 999 - b.sequence ?? 999)
        .forEach((trx, index) => {
          transactions.push(
            createAddTransaction(
              {
                address: session.address,
                did: session.did,
                pubkey: session.pubkey,
              },
              trx,
              index + 1 + lastTrxInSequence.sequence,
            ),
          );
        });
    } catch (error) {
      return returnError(error.message);
    }

    const validUntil = new Date(Date.now() + 1000 * 60 * 2); // 2 minutes
    if (lastTrxDone) {
      // set first transaction in newly added sequence as active and valid for 2 minutes
      // @ts-ignore
      transactions[0].validUntil = validUntil;
      // @ts-ignore
      transactions[0].active = true;
    }

    const res = await this.prisma.transactionsSessionV2.update({
      where: { hash: dto.hash },
      data: {
        ...(lastTrxDone ? { validUntil } : {}),
        transactions: {
          createMany: {
            data: transactions,
          },
        },
      },
      include: { transactions: true },
    });

    const activeTrx = res.transactions.find((t) => t.active);

    return returnSuccess({
      message: 'Transactions added to session successfully',
      activeTransaction: {
        hash: activeTrx.hash,
        sequence: activeTrx.sequence,
        validUntil: activeTrx.validUntil,
      },
    });
  }

  async fetchSession(dto: TransactionFetchDto) {
    // validate request
    if (!dto.hash) {
      return returnError('Invalid request, missing parameters');
    }

    const session = await this.prisma.transactionsSessionV2.findUnique({
      where: { hash: dto.hash },
    });
    if (!session) {
      return returnError('Transaction session not found');
    }

    return returnSuccess(session);
  }

  async fetchTransaction(dto: TransactionFetchDto) {
    // validate request
    if (!dto.hash) {
      return returnError('Invalid request, missing parameters');
    }

    const transaction = await this.prisma.transactionV2.findUnique({
      where: { hash: dto.hash },
    });
    if (!transaction) {
      return returnError('Transaction request not found');
    }

    return returnSuccess(transaction);
  }

  async updateTransaction(dto: TransactionUpdateDto) {
    // validate request
    if (!dto.hash || !dto.data || typeof dto.success !== 'boolean') {
      return returnError('Invalid request, missing parameters');
    }

    const transaction = await this.prisma.transactionV2.findUnique({
      where: { hash: dto.hash },
    });
    if (!transaction) {
      return returnError('Transaction request not found');
    }
    if (!transaction.active) {
      return returnError('Transaction request is not active');
    }
    if (transaction.data) {
      return returnError('Transaction request already contains data');
    }

    const session = await this.prisma.transactionsSessionV2.findUnique({
      where: { hash: transaction.transactionsSessionHash },
      include: { transactions: true },
    });
    if (!session) {
      return returnError('Transaction session not found');
    }

    const nextActiveTrx = session.transactions.find(
      (s) => s.sequence === transaction.sequence + 1,
    );

    const validUntil = new Date(Date.now() + 1000 * 60 * 2); // 2 minutes

    await this.prisma.$transaction(
      [
        this.prisma.transactionsSessionV2.update({
          where: { hash: transaction.transactionsSessionHash },
          data: { validUntil },
        }),
        this.prisma.transactionV2.update({
          where: { hash: dto.hash },
          data: { data: dto.data, success: dto.success, active: false },
        }),
        nextActiveTrx
          ? this.prisma.transactionV2.update({
              where: { hash: nextActiveTrx.hash },
              data: { active: true, validUntil },
            })
          : null,
      ].filter((p) => p),
    );

    return returnSuccess({
      message: 'Transaction request updated successfully',
      validUntil,
      // return next active transaction if available
      ...(nextActiveTrx
        ? {
            activeTransaction: {
              ...nextActiveTrx,
              validUntil,
              active: true,
            },
          }
        : null),
    });
  }

  async responseTransaction(dto: TransactionV2ResponseDto) {
    // validate request
    if (!dto.hash || !dto.secureNonce) {
      return returnError('Invalid request, missing parameters');
    }

    const transaction = await this.prisma.transactionV2.findUnique({
      where: { hash: dto.hash },
    });
    if (!transaction) {
      return returnError('Transaction request not found');
    }

    const session = await this.prisma.transactionsSessionV2.findUnique({
      where: { hash: transaction.transactionsSessionHash },
      select: {
        hash: true,
        transactions: { where: { sequence: 1 } },
        validUntil: true,
      },
    });
    if (!session) {
      return returnError('Transaction session not found');
    }

    // validate session hash with secureNonce, to ensure user have the correct secureNonce and correct hash was generated
    const secureHash = generateSecureHash(
      session.transactions[0]?.hash ?? '',
      dto.secureNonce,
    );
    if (session.hash !== secureHash) {
      return returnError('Invalid request, hash mismatch');
    }

    if (!transaction.data) {
      return returnError('Transaction request does not contain data', 418);
    }

    const nextActiveTrx = await this.prisma.transactionV2.findFirst({
      where: {
        transactionsSessionHash: session.hash,
        active: true,
      },
    });

    return returnSuccess({
      message: 'Transaction request found',
      data: transaction.data,
      success: transaction.success,
      validUntil: session.validUntil,
      // return next active transaction if available
      ...(nextActiveTrx
        ? {
            activeTransaction: {
              hash: nextActiveTrx.hash,
              sequence: nextActiveTrx.sequence,
              validUntil: nextActiveTrx.validUntil,
            },
          }
        : null),
    });
  }

  async sessionNextActive(dto: TransactionV2ResponseDto) {
    // validate request
    if (!dto.hash || !dto.secureNonce) {
      return returnError('Invalid request, missing parameters');
    }

    const session = await this.prisma.transactionsSessionV2.findUnique({
      where: { hash: dto.hash },
      select: { hash: true, transactions: true, validUntil: true },
    });
    if (!session) {
      return returnError('Transaction session not found');
    }

    // validate session hash with secureNonce, to ensure user have the correct secureNonce and correct hash was generated
    const secureHash = generateSecureHash(
      session.transactions.find((t) => t.sequence === 1)?.hash ?? '',
      dto.secureNonce,
    );
    if (session.hash !== secureHash) {
      return returnError('Invalid request, hash mismatch');
    }

    if (session.validUntil < new Date()) {
      return returnError('Transaction session expired');
    }

    const nextActiveTrx = session.transactions.find((t) => t.active);

    if (!nextActiveTrx) {
      return returnError('Transaction session has no active transaction', 418);
    }

    return returnSuccess({
      message: 'Transaction session active transaction found',
      success: true,
      activeTransaction: {
        hash: nextActiveTrx.hash,
        sequence: nextActiveTrx.sequence,
        validUntil: nextActiveTrx.validUntil,
      },
    });
  }

  // clear expired transaction requests every minute
  @Cron(CronExpression.EVERY_MINUTE)
  async clearExpiredTransactionSessions() {
    const nowPlus2Minutes = new Date(Date.now() + 1000 * 60 * 2); // 2 minutes added to current time for leaway gap
    await this.prisma.transactionsSessionV2.deleteMany({
      where: {
        validUntil: {
          lte: nowPlus2Minutes,
        },
      },
    });
  }
}
