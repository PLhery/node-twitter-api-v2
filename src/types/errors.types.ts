import { TwitterResponse } from '../types';
import { ClientRequest, IncomingMessage } from 'http';

export type TRequestError = TwitterApiRequestError | TwitterApiError;

export interface TwitterErrorPayload<T = any> {
  request: ClientRequest;
  rawResponse?: IncomingMessage;
  response?: TwitterResponse<T>;
  error?: Error;
}

export interface TwitterApiErrorData {
  errors: {
    message: string;
    [name: string]: any;
  }[];
  title?: string;
  detail?: string;
  type?: string;
}

export enum ETwitterApiError {
  Request = 'request',
  Response = 'response',
}

export interface TwitterApiRequestError {
  type: ETwitterApiError.Request;
  error: true;
  raw: {
    request: ClientRequest;
  };
  requestError: Error;
}

export interface TwitterApiError extends TwitterResponse<TwitterApiErrorData> {
  type: ETwitterApiError.Response;
  error: true;
  /** HTTP status code */
  code: number;
  raw: {
    request: ClientRequest;
    response: IncomingMessage;
  };
}
