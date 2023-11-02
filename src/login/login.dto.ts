export class LoginCreateDto {
  hash: string;
  secureHash: string;
  data: string;
  success: boolean;
}

export class LoginFetchDto {
  hash: string;
  secureNonce: string;
}
