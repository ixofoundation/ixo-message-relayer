import { Injectable } from '@nestjs/common';
import {
  TransactionV2AddDto,
  TransactionV2CreateDto,
  TransactionFetchDto,
  TransactionV2ResponseDto,
  TransactionUpdateDto,
} from './transaction.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  createAddTransaction,
  returnError,
  returnSuccess,
  CreateAddTransactionReturn,
} from 'src/utils';
import { generateSecureHash } from '@ixo/signx-sdk';
import { pool, withTransaction } from 'src/postgres/client';

@Injectable()
export class TransactionServiceV2 {
  constructor() {}

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

    // order transactions by sequence and create them
    const transactions: CreateAddTransactionReturn[] = [];
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
    transactions[0].validUntil = validUntil;
    transactions[0].active = true;

    await withTransaction(async (client) => {
      // create session
      await client.query(
        `INSERT INTO "TransactionsSessionV2" ("hash","address","did","pubkey","validUntil") VALUES ($1,$2,$3,$4,$5)`,
        [dto.hash, dto.address, dto.did, dto.pubkey, validUntil],
      );

      // insert transactions
      const insertTrxQuery = `INSERT INTO "TransactionV2" ("hash","txBodyHex","success","validUntil","data","timestamp","sequence","active","transactionsSessionHash")
                              VALUES ($1,$2,false,$3,NULL,$4,$5,$6,$7)`;
      for (const trx of transactions) {
        await client.query(insertTrxQuery, [
          trx.hash,
          trx.txBodyHex,
          trx.validUntil ?? null,
          trx.timestamp,
          trx.sequence,
          trx.active ?? false,
          dto.hash,
        ]);
      }
    });

    return returnSuccess({
      message: 'Transactions session created successfully',
      activeTransaction: {
        hash: transactions[0].hash,
        sequence: transactions[0].sequence,
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

    const session = await this.fetchSessionByHash(dto.hash);
    if (!session) {
      return returnError('Transactions session not found', 418); // 418 I'm a teapot, for sdk to know to start new session
    }
    if (session.validUntil < new Date()) {
      return returnError('Transactions session expired', 418); // 418 I'm a teapot, for sdk to know to start new session
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

    // order new transactions by sequence (if any provided) and create them
    const transactions: CreateAddTransactionReturn[] = [];
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
      transactions[0].validUntil = validUntil;
      transactions[0].active = true;
    }

    await withTransaction(async (client) => {
      if (lastTrxDone) {
        await client.query(
          `UPDATE "TransactionsSessionV2" SET "validUntil" = $2 WHERE "hash" = $1`,
          [dto.hash, validUntil],
        );
      }

      const insertTrxQuery = `INSERT INTO "TransactionV2" ("hash","txBodyHex","success","validUntil","data","timestamp","sequence","active","transactionsSessionHash")
                              VALUES ($1,$2,false,$3,NULL,$4,$5,$6,$7)`;
      for (const trx of transactions) {
        await client.query(insertTrxQuery, [
          trx.hash,
          trx.txBodyHex,
          trx.validUntil ?? null,
          trx.timestamp,
          trx.sequence,
          trx.active ?? false,
          dto.hash,
        ]);
      }
    });

    const updatedSession = await this.fetchSessionByHash(dto.hash);
    const activeTrx = updatedSession.transactions.find((t) => t.active);

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

    const session = await this.fetchSessionByHash(dto.hash);
    if (!session) {
      return returnError('Transaction session not found');
    }
    if (session.validUntil < new Date()) {
      return returnError('Transaction session expired');
    }

    return returnSuccess(session);
  }

  async fetchTransaction(dto: TransactionFetchDto): Promise<any> {
    // validate request
    if (!dto.hash) {
      return returnError('Invalid request, missing parameters');
    }

    const session = await this.fetchSessionByHash(dto.hash);
    if (!session) {
      return returnError('Transaction session not found');
    }
    if (session.validUntil < new Date()) {
      return returnError('Transaction session expired');
    }

    const activeTrx = session.transactions.find((t) => t.active);
    if (!activeTrx) {
      return returnError('No next active transaction', 418); // 418 I'm a teapot, for mobile to know to keep polling
    }

    return returnSuccess(activeTrx);
  }

  async updateTransaction(dto: TransactionUpdateDto) {
    // validate request
    if (!dto.hash || !dto.data || typeof dto.success !== 'boolean') {
      return returnError('Invalid request, missing parameters');
    }

    const transaction = await this.fetchTransactionByHash(dto.hash);
    if (!transaction) {
      return returnError('Transaction request not found');
    }
    if (!transaction.active) {
      return returnError('Transaction request is not active');
    }
    if (transaction.data) {
      return returnError('Transaction request already contains data');
    }

    const session = await this.fetchSessionByHash(
      transaction.transactionsSessionHash,
    );
    if (!session) {
      return returnError('Transaction session not found');
    }

    // if the update for transaction is success, set next transaction as active, otherwise dont to break session flow
    const nextActiveTrx = dto.success
      ? session.transactions.find(
          (s) => s.sequence === transaction.sequence + 1,
        )
      : undefined;

    // if the update for transaction is success, update session validUntil to 2 minutes from now, otherwise expire it, so
    // clients can handle the error, but need to start new session
    const validUntil = new Date(Date.now() + (dto.success ? 1000 * 60 * 2 : 0)); // 2 minutes

    await withTransaction(async (client) => {
      // update session validUntil
      await client.query(
        `UPDATE "TransactionsSessionV2" SET "validUntil" = $2 WHERE "hash" = $1`,
        [transaction.transactionsSessionHash, validUntil],
      );

      // update current transaction
      await client.query(
        `UPDATE "TransactionV2" SET "data"=$2,"success"=$3,"active"=false WHERE "hash"=$1`,
        [dto.hash, dto.data, dto.success],
      );

      if (nextActiveTrx) {
        await client.query(
          `UPDATE "TransactionV2" SET "active"=true,"validUntil"=$2 WHERE "hash"=$1`,
          [nextActiveTrx.hash, validUntil],
        );
      }
    });

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

  async responseTransaction(dto: TransactionV2ResponseDto): Promise<any> {
    // validate request
    if (!dto.hash || !dto.secureNonce) {
      return returnError('Invalid request, missing parameters');
    }

    const transaction = await this.fetchTransactionByHash(dto.hash);
    if (!transaction) {
      return returnError('Transaction request not found');
    }

    const session = await this.fetchSessionByHash(
      transaction.transactionsSessionHash,
    );
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

    if (!transaction.data) {
      return returnError('Transaction request does not contain data', 418); // 418 I'm a teapot, for sdk to know to keep polling
    }

    const nextActiveTrx = session.transactions.find((t) => t.active);

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

  async sessionNextActive(dto: TransactionV2ResponseDto): Promise<any> {
    // validate request
    if (!dto.hash || !dto.secureNonce) {
      return returnError('Invalid request, missing parameters');
    }

    const session = await this.fetchSessionByHash(dto.hash);
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
      return returnError('Transaction session has no active transaction', 418); // 418 I'm a teapot, for sdk to know to keep polling
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
    const nowSub2Minutes = new Date(Date.now() - 1000 * 60 * 2); // 2 minutes subtracted to current time for leaway gap
    await pool.query(
      `DELETE FROM "TransactionsSessionV2" WHERE "validUntil" <= $1`,
      [nowSub2Minutes],
    );
  }

  // Helper functions
  private async fetchSessionByHash(hash: string): Promise<{
    hash: string;
    address: string;
    did: string;
    pubkey: string;
    validUntil: Date;
    transactions: any[];
  } | null> {
    const sessionResult = await pool.query(
      `SELECT * FROM "TransactionsSessionV2" WHERE "hash"=$1`,
      [hash],
    );
    const session = sessionResult.rows[0];
    if (!session) return null;

    const trxResult = await pool.query(
      `SELECT * FROM "TransactionV2" WHERE "transactionsSessionHash"=$1 ORDER BY "sequence" ASC`,
      [hash],
    );
    return {
      ...session,
      transactions: trxResult.rows,
    };
  }

  private async fetchTransactionByHash(hash: string): Promise<{
    hash: string;
    txBodyHex: string;
    success: boolean;
    validUntil: Date | null;
    data: any;
    timestamp: string;
    sequence: number;
    active: boolean;
    transactionsSessionHash: string;
  } | null> {
    const result = await pool.query(
      `SELECT * FROM "TransactionV2" WHERE "hash"=$1`,
      [hash],
    );
    if (result.rows.length === 0) return null;
    return result.rows[0];
  }
}
