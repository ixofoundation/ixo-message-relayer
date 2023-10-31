export class LoginCreateDto {
  hash: string;
  secureHash: string;
  data: string;
}

export class LoginFetchDto {
  hash: string;
  secureNonce: string;
}
