import crypto from 'crypto';

export type TRANSACT_DTO = {
  address: string;
  did: string;
  pubkey: string;
  txBodyHex: string;
  timestamp: string;
};

export const hashTransactData = (data: TRANSACT_DTO): string => {
  const formattedData = {
    address: data.address,
    did: data.did,
    pubkey: data.pubkey,
    txBodyHex: data.txBodyHex,
    timestamp: data.timestamp,
  };
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(formattedData))
    .digest('hex');
};

export const generateSecureHash = (hash: string, nonce: string): string => {
  return crypto
    .createHash('sha256')
    .update(hash + nonce)
    .digest('hex');
};
