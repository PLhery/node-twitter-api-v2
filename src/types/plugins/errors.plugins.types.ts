import type { TwitterResponse } from '../responses.types';

export class RequestAlreadyAvailableInCacheException extends Error {
  constructor(message: string, public response: TwitterResponse<any>) {
    super(message);

    Error.captureStackTrace(this, this.constructor);
  }
}
