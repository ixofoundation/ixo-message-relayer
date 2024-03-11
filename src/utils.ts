import { hashTransactData } from '@ixo/signx-sdk';

export const returnError = (message: string, code?: number) => ({
  success: false,
  ...(code ? { code } : null),
  data: {
    message,
  },
});

export const returnSuccess = (data?: any) => ({
  success: true,
  data,
});

// Helper function to run through validation and sequence increase etc and returns the transction object to be saved
export type CreateAddTransactionReturn = ReturnType<
  typeof createAddTransaction
>;
export const createAddTransaction = (
  session: {
    address: string;
    did: string;
    pubkey: string;
  },
  trx: {
    hash: string;
    txBodyHex: string;
    timestamp: string;
  },
  sequence: number,
) => {
  // validate request
  if (!trx.hash || !trx.txBodyHex || !trx.timestamp) {
    throw new Error('Invalid request, missing parameters');
  }

  // validate hash
  const generatedHash = hashTransactData({
    address: session.address,
    did: session.did,
    pubkey: session.pubkey,
    txBodyHex: trx.txBodyHex,
    timestamp: trx.timestamp,
  });
  if (generatedHash !== trx.hash) {
    throw new Error('Invalid request, hash mismatch');
  }

  return {
    hash: trx.hash,
    txBodyHex: trx.txBodyHex,
    timestamp: trx.timestamp,
    sequence: sequence,
  };
};
