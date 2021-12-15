import { TwitterRateLimit, TwitterResponse } from '../types';
import TweetStream from '../stream/TweetStream';
import type { RequestOptions } from 'https';
import { trimUndefinedProperties } from '../helpers';
import OAuth1Helper from './oauth1.helper';
import RequestHandlerHelper from './request-handler.helper';
import RequestParamHelpers from './request-param.helper';
import { OAuth2Helper } from './oauth2.helper';

export type TRequestFullData = {
  url: URL,
  options: RequestOptions,
  body?: any,
  rateLimitSaver?: (rateLimit: TwitterRateLimit) => any
};
export type TRequestFullStreamData = TRequestFullData & { payloadIsError?: (data: any) => boolean };
export type TRequestQuery = Record<string, string | number | boolean | string[] | undefined>;
export type TRequestStringQuery = Record<string, string>;
export type TRequestBody = Record<string, any> | Buffer;
export type TBodyMode = 'json' | 'url' | 'form-data' | 'raw';

interface IWriteAuthHeadersArgs {
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
  enableAuth?: boolean;
  enableRateLimitSave?: boolean;
  timeout?: number;
}

export interface IGetStreamRequestArgs {
  payloadIsError?: (data: any) => boolean;
  autoConnect?: boolean;
}

interface IGetStreamRequestArgsAsync {
  payloadIsError?: (data: any) => boolean;
  autoConnect?: true;
}

interface IGetStreamRequestArgsSync {
  payloadIsError?: (data: any) => boolean;
  autoConnect: false;
}

export type TCustomizableRequestArgs = Pick<IGetHttpRequestArgs, 'headers' | 'params' | 'forceBodyMode' | 'enableAuth' | 'enableRateLimitSave'>;

export abstract class ClientRequestMaker {
  protected _bearerToken?: string;
  protected _consumerToken?: string;
  protected _consumerSecret?: string;
  protected _accessToken?: string;
  protected _accessSecret?: string;
  protected _basicToken?: string;
  protected _clientId?: string;
  protected _clientSecret?: string;
  protected _oauth?: OAuth1Helper;
  protected _rateLimits: { [endpoint: string]: TwitterRateLimit } = {};

  protected static readonly BODY_METHODS = new Set(['POST', 'PUT', 'PATCH']);

  protected saveRateLimit(originalUrl: string, rateLimit: TwitterRateLimit) {
    this._rateLimits[originalUrl] = rateLimit;
  }

  /** Send a new request and returns a wrapped `Promise<TwitterResponse<T>`. */
  send<T = any>(requestParams: IGetHttpRequestArgs) : Promise<TwitterResponse<T>> {
    const args = this.getHttpRequestArgs(requestParams);
    const options = { method: args.method, headers: args.headers, timeout: requestParams.timeout };
    const enableRateLimitSave = requestParams.enableRateLimitSave !== false;

    if (args.body) {
      RequestParamHelpers.setBodyLengthHeader(options, args.body);
    }

    return new RequestHandlerHelper<T>({
      url: args.url,
      options,
      body: args.body,
      rateLimitSaver: enableRateLimitSave ? this.saveRateLimit.bind(this, args.rawUrl) : undefined,
    })
      .makeRequest();
  }

  /**
   * Create a new request, then creates a stream from it as a `TweetStream`.
   *
   * Request will be sent only if `autoConnect` is not set or `true`: return type will be `Promise<TweetStream>`.
   * If `autoConnect` is `false`, a `TweetStream` is directly returned and you should call `stream.connect()` by yourself.
   */
  sendStream<T = any>(requestParams: IGetHttpRequestArgs & IGetStreamRequestArgsSync) : TweetStream<T>;
  sendStream<T = any>(requestParams: IGetHttpRequestArgs & IGetStreamRequestArgsAsync) : Promise<TweetStream<T>>;
  sendStream<T = any>(requestParams: IGetHttpRequestArgs & IGetStreamRequestArgs) : Promise<TweetStream<T>> | TweetStream<T>;

  sendStream<T = any>(requestParams: IGetHttpRequestArgs & IGetStreamRequestArgs) : Promise<TweetStream<T>> | TweetStream<T> {
    const args = this.getHttpRequestArgs(requestParams);
    const options = { method: args.method, headers: args.headers };
    const enableRateLimitSave = requestParams.enableRateLimitSave !== false;
    const enableAutoConnect = requestParams.autoConnect !== false;

    if (args.body) {
      RequestParamHelpers.setBodyLengthHeader(options, args.body);
    }

    const requestData: TRequestFullStreamData = {
      url: args.url,
      options,
      body: args.body,
      rateLimitSaver: enableRateLimitSave ? this.saveRateLimit.bind(this, args.rawUrl) : undefined,
      payloadIsError: requestParams.payloadIsError,
    };

    const stream = new TweetStream<T>(requestData);

    if (!enableAutoConnect) {
      return stream;
    }
    return stream.connect();
  }


  /* Token helpers */

  protected buildOAuth() {
    if (!this._consumerSecret || !this._consumerToken)
      throw new Error('Invalid consumer tokens');

    return new OAuth1Helper({
      consumerKeys: { key: this._consumerToken, secret: this._consumerSecret },
    });
  }

  protected getOAuthAccessTokens() {
    if (!this._accessSecret || !this._accessToken)
      return;

    return {
      key: this._accessToken,
      secret: this._accessSecret,
    };
  }


  /* Request helpers */

  protected writeAuthHeaders({ headers, bodyInSignature, url, method, query, body }: IWriteAuthHeadersArgs) {
    headers = { ...headers };

    if (this._bearerToken) {
      headers.Authorization = 'Bearer ' + this._bearerToken;
    }
    else if (this._basicToken) {
      // Basic auth, to request a bearer token
      headers.Authorization = 'Basic ' + this._basicToken;
    }
    else if (this._clientId && this._clientSecret) {
      // Basic auth with clientId + clientSecret
      headers.Authorization = 'Basic ' + OAuth2Helper.getAuthHeader(this._clientId, this._clientSecret);
    }
    else if (this._consumerSecret && this._oauth) {
      // Merge query and body
      const data = bodyInSignature ? RequestParamHelpers.mergeQueryAndBodyForOAuth(query, body) : query;

      const auth = this._oauth.authorize({
        url: url.toString(),
        method,
        data,
      }, this.getOAuthAccessTokens());

      headers = { ...headers, ...this._oauth.toHeader(auth) };
    }

    return headers;
  }

  protected getHttpRequestArgs({
    url, method, query: rawQuery = {},
    body: rawBody = {}, headers,
    forceBodyMode, enableAuth, params,
  }: IGetHttpRequestArgs) {
    let body: string | Buffer | undefined = undefined;
    method = method.toUpperCase();
    headers = headers ?? {};

    // Add user agent header (Twitter recommands it)
    if (!headers['x-user-agent']) {
      headers['x-user-agent'] = 'Node.twitter-api-v2';
    }

    // Add protocol to URL if needed
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }

    // Convert URL to object that will receive all URL modifications
    const urlObject = new URL(url);
    // URL without query string to save as endpoint name
    const rawUrl = urlObject.origin + urlObject.pathname;

    // Apply URL parameters
    if (params) {
      RequestParamHelpers.applyRequestParametersToUrl(urlObject, params);
    }

    // Build an URL without anything in QS, and QSP in query
    const query = RequestParamHelpers.formatQueryToString(rawQuery);
    RequestParamHelpers.moveUrlQueryParamsIntoObject(urlObject, query);

    // Delete undefined parameters
    if (!(rawBody instanceof Buffer)) {
      trimUndefinedProperties(rawBody);
    }

    // OAuth signature should not include parameters when using multipart.
    const bodyType = forceBodyMode ?? RequestParamHelpers.autoDetectBodyType(urlObject);

    // If undefined or true, enable auth by headers
    if (enableAuth !== false) {
      // OAuth needs body signature only if body is URL encoded.
      const bodyInSignature = ClientRequestMaker.BODY_METHODS.has(method) && bodyType === 'url';

      headers = this.writeAuthHeaders({ headers, bodyInSignature, method, query, url: urlObject, body: rawBody });
    }

    if (ClientRequestMaker.BODY_METHODS.has(method)) {
      body = RequestParamHelpers.constructBodyParams(rawBody, headers, bodyType) || undefined;
    }

    RequestParamHelpers.addQueryParamsToUrl(urlObject, query);

    return {
      rawUrl,
      url: urlObject,
      method,
      headers,
      body,
    };
  }
}
