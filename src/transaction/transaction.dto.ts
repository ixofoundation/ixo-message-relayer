export class TransactionCreateDto {
  hash: string;
  address: string;
  did: string;
  pubkey: string;
  txBodyHex: string;
  timestamp: string;
}

export class TransactionV2CreateDto {
  hash: string; // Used for initial transaction validation
  address: string;
  did: string;
  pubkey: string;
  transactions: TransactionV2AddDto;
}

export class TransactionV2AddDto {
  hash: string; // Session hash to add transactions to
  secureNonce: string; // Unique nonce provided by the SDK
  transactions: TransactionV2Dto[];
}

export class TransactionV2Dto {
  hash: string; // Used for initial transaction validation
  txBodyHex: string;
  timestamp: string;
  sequence?: number;
}

export class TransactionFetchDto {
  hash: string;
}

export class TransactionV2ResponseDto {
  hash: string;
  secureNonce: string; // Unique nonce provided by the SDK
}

export class TransactionUpdateDto {
  hash: string;
  data: string;
  success: boolean;
}
