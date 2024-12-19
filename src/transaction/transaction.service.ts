import { Injectable } from '@nestjs/common';
import {
  TransactionCreateDto,
  TransactionFetchDto,
  TransactionUpdateDto,
} from './transaction.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { returnError, returnSuccess } from 'src/utils';
import { hashTransactData } from '@ixo/signx-sdk';
import { pool } from 'src/postgres/client';

@Injectable()
export class TransactionService {
  constructor() {}

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

    // Upsert logic
    const existing = await pool.query(
      `SELECT * FROM "Transaction" WHERE "hash" = $1`,
      [dto.hash],
    );

    if (existing.rows.length === 0) {
      // insert
      await pool.query(
        `INSERT INTO "Transaction" ("hash","address","did","pubkey","txBodyHex","timestamp","validUntil","success")
         VALUES ($1,$2,$3,$4,$5,$6,$7,false)`,
        [
          dto.hash,
          dto.address,
          dto.did,
          dto.pubkey,
          dto.txBodyHex,
          dto.timestamp,
          validUntil,
        ],
      );
    } else {
      // update
      await pool.query(
        `UPDATE "Transaction" SET "address"=$2,"did"=$3,"pubkey"=$4,"txBodyHex"=$5,"timestamp"=$6,"validUntil"=$7
         WHERE "hash"=$1`,
        [
          dto.hash,
          dto.address,
          dto.did,
          dto.pubkey,
          dto.txBodyHex,
          dto.timestamp,
          validUntil,
        ],
      );
    }

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

    const result = await pool.query(
      `SELECT * FROM "Transaction" WHERE "hash" = $1`,
      [dto.hash],
    );
    const transaction = result.rows[0];
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

    const result = await pool.query(
      `SELECT * FROM "Transaction" WHERE "hash" = $1`,
      [dto.hash],
    );
    const transaction = result.rows[0];
    if (!transaction) {
      return returnError('Transaction request not found');
    }
    if (transaction.data) {
      return returnError('Transaction request already contain data');
    }

    await pool.query(
      `UPDATE "Transaction" SET "data"=$2,"success"=$3 WHERE "hash"=$1`,
      [dto.hash, dto.data, dto.success],
    );

    return returnSuccess({
      message: 'Transaction request updated successfully',
    });
  }

  async responseTransaction(dto: TransactionFetchDto) {
    // validate request
    if (!dto.hash) {
      return returnError('Invalid request, missing parameters');
    }

    const result = await pool.query(
      `SELECT * FROM "Transaction" WHERE "hash" = $1`,
      [dto.hash],
    );
    const transaction = result.rows[0];
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
    await pool.query(`DELETE FROM "Transaction" WHERE "validUntil" <= $1`, [
      nowSub2Minutes,
    ]);
  }
}
