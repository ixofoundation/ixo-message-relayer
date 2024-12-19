import { Injectable } from '@nestjs/common';
import {
  DataResponseDto,
  DataCreateDto,
  DataUpdateDto,
  DataFetchDto,
} from './data.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { generateSecureHash } from '@ixo/signx-sdk';
import { returnError, returnSuccess } from 'src/utils';
import { pool } from 'src/postgres/client';

@Injectable()
export class DataService {
  constructor() {}

  async createData(dto: DataCreateDto) {
    // validate request
    if (!dto.hash || !dto.data || !dto.type) {
      return returnError('Invalid request, missing parameters');
    }

    const validUntil = new Date(Date.now() + 1000 * 60 * 2); // 2 minutes

    // upsert logic:
    // Try SELECT first:
    const existing = await pool.query(
      `SELECT * FROM "Data" WHERE "hash" = $1`,
      [dto.hash],
    );

    if (existing.rows.length === 0) {
      // insert new record
      await pool.query(
        `INSERT INTO "Data" ("hash","data","type","validUntil") VALUES ($1,$2,$3,$4)`,
        [dto.hash, dto.data, dto.type, validUntil],
      );
    } else {
      // update existing record
      await pool.query(
        `UPDATE "Data" SET "data" = $2, "type" = $3, "validUntil" = $4 WHERE "hash" = $1`,
        [dto.hash, dto.data, dto.type, validUntil],
      );
    }

    return returnSuccess({
      message: 'Data request created successfully',
    });
  }

  async fetchDataResponse(dto: DataResponseDto): Promise<any> {
    // validate request
    if (!dto.hash || !dto.secureNonce) {
      return returnError('Invalid request, missing parameters');
    }

    const result = await pool.query(`SELECT * FROM "Data" WHERE "hash" = $1`, [
      dto.hash,
    ]);
    const data = result.rows[0];
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
    await pool.query(`DELETE FROM "Data" WHERE "hash" = $1`, [dto.hash]);

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

    const result = await pool.query(`SELECT * FROM "Data" WHERE "hash" = $1`, [
      dto.hash,
    ]);
    const data = result.rows[0];
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
    if (
      !dto.hash ||
      !dto.secureHash ||
      typeof dto.success !== 'boolean' ||
      !dto.response
    ) {
      return returnError('Invalid request, missing parameters');
    }

    const result = await pool.query(`SELECT * FROM "Data" WHERE "hash" = $1`, [
      dto.hash,
    ]);
    const data = result.rows[0];
    if (!data) {
      return returnError('Data not found');
    }
    if (data.validUntil < new Date()) {
      return returnError('Data expired');
    }

    // update data with response
    await pool.query(
      `UPDATE "Data" SET "secureHash" = $2, "success" = $3, "response" = $4 WHERE "hash" = $1`,
      [dto.hash, dto.secureHash, dto.success, dto.response],
    );

    return returnSuccess({
      message: 'Data updated successfully',
    });
  }

  // clear expired data every 5 minutes
  @Cron(CronExpression.EVERY_5_MINUTES)
  async clearExpiredData() {
    await pool.query(`DELETE FROM "Data" WHERE "validUntil" <= $1`, [
      new Date(),
    ]);
  }
}
