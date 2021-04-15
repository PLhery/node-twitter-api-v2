import { IncomingHttpHeaders } from 'http';

export interface TwitterResponse<T> {
  headers: IncomingHttpHeaders;
  data: T;
  rateLimit?: TwitterRateLimit;
}

export interface TwitterRateLimit {
  limit: number;
  reset: number;
  remaining: number;
}

export interface RequestTokenResult {
  oauth_token: string;
  oauth_token_secret: string;
  oauth_callback_confirmed: 'true';
}

export interface AccessTokenResult {
  oauth_token: string;
  oauth_token_secret: string;
  user_id: string;
  screen_name: string;
}

export interface BearerTokenResult {
  token_type: 'bearer';
  access_token: string;
}
