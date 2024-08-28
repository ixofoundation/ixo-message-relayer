export class MatrixLoginCreateDto {
  hash: string;
  secureHash: string;
  data: string;
  success: boolean;
}

export class MatrixLoginFetchDto {
  hash: string;
  secureNonce: string;
}
