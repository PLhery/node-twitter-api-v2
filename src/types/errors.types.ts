import type { TwitterRateLimit, TwitterResponse } from '../types';
import type { ClientRequest, IncomingMessage, IncomingHttpHeaders } from 'http';
import type { ErrorV2 } from './v2';

export type TRequestError = TwitterApiRequestError | TwitterApiError;

export interface TwitterErrorPayload<T = any> {
  request: ClientRequest;
  rawResponse?: IncomingMessage;
  response?: TwitterResponse<T>;
  error?: Error;
}

export interface TwitterApiErrorData {
  errors: ErrorV2[];
  title?: string;
  detail?: string;
  type?: string;
}

export enum ETwitterApiError {
  Request = 'request',
  Response = 'response',
}

/* OLD ERRORS INTERFACES */

export interface TwitterApiRequestError {
  type: ETwitterApiError.Request;
  error: true;
  requestError: Error;
}

export interface TwitterApiError extends TwitterResponse<TwitterApiErrorData> {
  type: ETwitterApiError.Response;
  error: true;
  /** HTTP status code */
  code: number;
}

/* ERRORS INSTANCES */

abstract class ApiError extends Error {
  abstract type: ETwitterApiError.Request | ETwitterApiError.Response;
  abstract request: ClientRequest;
  error = true as const;
}

interface IBuildApiRequestError {
  request: ClientRequest;
  error: Error;
}

export class ApiRequestError extends ApiError implements TwitterApiRequestError {
  type = ETwitterApiError.Request as const;
  request: ClientRequest;
  requestError: Error;

  constructor(message: string, options: IBuildApiRequestError) {
    super(message);

    Error.captureStackTrace(this, this.constructor);

    this.request = options.request;
    this.requestError = options.error;
  }
}

interface IBuildApiResponseError {
  code: number;
  request: ClientRequest;
  response: IncomingMessage;
  headers: IncomingHttpHeaders;
  data: TwitterApiErrorData;
  rateLimit?: TwitterRateLimit;
}

export class ApiResponseError extends ApiError implements TwitterApiError, IBuildApiResponseError {
  type = ETwitterApiError.Response as const;
  code: number;
  request: ClientRequest;
  response: IncomingMessage;
  headers: IncomingHttpHeaders;
  data: TwitterApiErrorData;
  rateLimit?: TwitterRateLimit;

  constructor(message: string, options: IBuildApiResponseError) {
    super(message);

    Error.captureStackTrace(this, this.constructor);

    this.code = options.code;
    this.request = options.request;
    this.response = options.response;
    this.headers = options.headers;
    this.rateLimit = options.rateLimit;
    this.data = options.data;
  }
}
