export type LoginRequest = {
  email: string;
  password: string;
  remember?: boolean;
};

export type LoginResponse = {
  token_type: string;   // ex.: "Bearer"
  access_token: string; // JWT
  expires_in: number;   // seconds (ex.: 14400)
};

export type StoredToken = {
  tokenType: string;
  accessToken: string;
  expiresAt: number; // epoch ms
};
