import type { RequestOptions } from 'https';
import type { TwitterApiBasicAuth, TwitterApiOAuth2Init, TwitterApiTokens } from './client.types';
import type { TwitterRateLimit } from './responses.types';

export type TRequestDebuggerHandlerEvent = 'abort' | 'close' | 'socket' | 'socket-error' | 'socket-connect'
  | 'socket-close' | 'socket-end' | 'socket-lookup' | 'socket-timeout' | 'request-error'
  | 'response' | 'response-aborted' | 'response-error' | 'response-close' | 'response-end';
export type TRequestDebuggerHandler = (event: TRequestDebuggerHandlerEvent, data?: any) => void;

/**
 * Request compression level. `true` means `'brotli'`, `false` means `'identity'`.
 * When `brotli` is unavailable (f.e. in streams), it will fallback to `gzip`.
 */
export type TRequestCompressionLevel = boolean | 'brotli' | 'gzip' | 'deflate' | 'identity';

export type TRequestFullData = {
  url: URL,
  options: RequestOptions,
  body?: any,
  rateLimitSaver?: (rateLimit: TwitterRateLimit) => any,
  requestEventDebugHandler?: TRequestDebuggerHandler,
  compression?: TRequestCompressionLevel,
  forceParseMode?: TResponseParseMode,
};

export type TRequestFullStreamData = TRequestFullData & { payloadIsError?: (data: any) => boolean };
export type TRequestQuery = Record<string, string | number | boolean | string[] | undefined>;
export type TRequestStringQuery = Record<string, string>;
export type TRequestBody = Record<string, any> | Buffer;
export type TBodyMode = 'json' | 'url' | 'form-data' | 'raw';
export type TResponseParseMode = 'json' | 'url' | 'text' | 'buffer' | 'none';

export interface IWriteAuthHeadersArgs {
  headers: Record<string, string>;
  bodyInSignature: boolean;
  url: URL;
  method: string;
  query: TRequestQuery;
  body: TRequestBody;
}

export interface IGetHttpRequestArgs {
  url: string;
  method: string;
  query?: TRequestQuery;
  /** The URL parameters, if you specify an endpoint with `:id`, for example. */
  params?: TRequestQuery;
  body?: TRequestBody;
  headers?: Record<string, string>;
  forceBodyMode?: TBodyMode;
  forceParseMode?: TResponseParseMode;
  enableAuth?: boolean;
  enableRateLimitSave?: boolean;
  timeout?: number;
  requestEventDebugHandler?: TRequestDebuggerHandler;
  compression?: TRequestCompressionLevel;
}

export interface IComputedHttpRequestArgs {
  rawUrl: string;
  url: URL;
  method: string;
  headers: Record<string, string>;
  body: string | Buffer | undefined;
}

export interface IGetStreamRequestArgs {
  payloadIsError?: (data: any) => boolean;
  autoConnect?: boolean;
}

export interface IGetStreamRequestArgsAsync {
  payloadIsError?: (data: any) => boolean;
  autoConnect?: true;
}

export interface IGetStreamRequestArgsSync {
  payloadIsError?: (data: any) => boolean;
  autoConnect: false;
}

export type TCustomizableRequestArgs = Pick<IGetHttpRequestArgs, 'forceParseMode' | 'compression' | 'timeout' | 'headers' | 'params' | 'forceBodyMode' | 'enableAuth' | 'enableRateLimitSave'>;

export type TAcceptedInitToken = TwitterApiTokens | TwitterApiOAuth2Init | TwitterApiBasicAuth | string;
