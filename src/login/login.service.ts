import { Injectable } from '@nestjs/common';
import { LoginFetchDto, LoginCreateDto } from './login.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { generateSecureHash } from '@ixo/signx-sdk';
import { returnError, returnSuccess } from 'src/utils';
import { pool } from 'src/postgres/client';

@Injectable()
export class LoginService {
  constructor() {}

  async createLogin(dto: LoginCreateDto) {
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

    // upsert logic
    const existing = await pool.query(
      `SELECT * FROM "Login" WHERE "hash" = $1`,
      [dto.hash],
    );

    if (existing.rows.length === 0) {
      // insert new login
      await pool.query(
        `INSERT INTO "Login" ("hash","secureHash","data","validUntil","success") VALUES ($1,$2,$3,$4,$5)`,
        [dto.hash, dto.secureHash, dto.data, validUntil, dto.success],
      );
    } else {
      // update existing login
      await pool.query(
        `UPDATE "Login" SET "secureHash" = $2, "data" = $3, "validUntil" = $4, "success" = $5 WHERE "hash" = $1`,
        [dto.hash, dto.secureHash, dto.data, validUntil, dto.success],
      );
    }

    return returnSuccess({
      message: 'Login request created successfully',
    });
  }

  async fetchLogin(dto: LoginFetchDto): Promise<any> {
    // validate request
    if (!dto.hash || !dto.secureNonce) {
      return returnError('Invalid request, missing parameters');
    }

    const result = await pool.query(`SELECT * FROM "Login" WHERE "hash" = $1`, [
      dto.hash,
    ]);
    const login = result.rows[0];
    if (!login) {
      return returnError('Login request not found', 418); // 418 I'm a teapot, for sdk to know to keep polling
    }

    // validate request
    const secureHash = generateSecureHash(dto.hash, dto.secureNonce);
    if (login.secureHash !== secureHash) {
      return returnError('Invalid request, hash mismatch');
    }
    if (login.validUntil < new Date()) {
      return returnError('Login request expired');
    }

    // remove login request after fetching
    await pool.query(`DELETE FROM "Login" WHERE "hash" = $1`, [dto.hash]);

    return returnSuccess({
      message: 'Login request fetched successfully',
      data: login.data,
      success: login.success,
    });
  }

  // clear expired login requests every minute
  @Cron(CronExpression.EVERY_5_MINUTES)
  async clearExpiredLogins() {
    await pool.query(`DELETE FROM "Login" WHERE "validUntil" <= $1`, [
      new Date(),
    ]);
  }
}
