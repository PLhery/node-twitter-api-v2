import type { IncomingHttpHeaders } from 'http';

export interface TwitterResponse<T> {
  headers: IncomingHttpHeaders;
  data: T;
  rateLimit?: TwitterRateLimit;
}

export interface SingleTwitterRateLimit {
  limit: number;
  reset: number;
  remaining: number;
}

export interface TwitterRateLimit extends SingleTwitterRateLimit {
  day?: SingleTwitterRateLimit;
}
