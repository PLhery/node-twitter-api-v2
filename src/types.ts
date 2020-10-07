import { IncomingHttpHeaders } from 'http';

export type NumberString = number | string;
export type BooleanString = boolean | string;

export interface TwitterApiErrorData {
  errors: {
    message: string;
    [name: string]: any;
  }[];
  title?: string;
  detail?: string;
  type?: string;
}

export interface TwitterApiError extends TwitterResponse<TwitterApiErrorData> {
  error: true;
  /** HTTP status code */
  code: number;
}

export interface TwitterApiTokens {
  appKey: string;
  appSecret: string;
  accessToken?: string;
  accessSecret?: string;
}

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
