import type { IncomingHttpHeaders } from 'http';

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
