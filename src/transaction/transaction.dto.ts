export class TransactionCreateDto {
  hash: string;
  address: string;
  did: string;
  pubkey: string;
  txBodyHex: string;
  timestamp: string;
}

export class TransactionFetchDto {
  hash: string;
}

export class TransactionUpdateDto {
  hash: string;
  response: string;
}
