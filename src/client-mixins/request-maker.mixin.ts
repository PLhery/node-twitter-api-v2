import { TwitterRateLimit, TwitterResponse } from '../types';
import TweetStream from '../stream/TweetStream';
import type { RequestOptions } from 'https';
import { trimUndefinedProperties } from '../helpers';
import OAuth1Helper from './oauth1.helper';
import RequestHandlerHelper from './request-handler.helper';
import RequestParamHelpers from './request-param.helper';

export type TRequestFullData = {
  url: string,
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
  url: string;
  method: string;
  query: TRequestQuery;
  body: TRequestBody;
}

export interface IGetHttpRequestArgs {
  url: string;
  method: string;
  query?: TRequestQuery;
  body?: TRequestBody;
  headers?: Record<string, string>;
  forceBodyMode?: TBodyMode;
  enableAuth?: boolean;
  enableRateLimitSave?: boolean;
}

export interface IGetStreamRequestArgs {
  payloadIsError?: (data: any) => boolean;
}

export type TCustomizableRequestArgs = Pick<IGetHttpRequestArgs, 'headers' | 'forceBodyMode' | 'enableAuth' | 'enableRateLimitSave'>;

export abstract class ClientRequestMaker {
  protected _bearerToken?: string;
  protected _consumerToken?: string;
  protected _consumerSecret?: string;
  protected _accessToken?: string;
  protected _accessSecret?: string;
  protected _basicToken?: string;
  protected _oauth?: OAuth1Helper;
  protected _rateLimits: { [endpoint: string]: TwitterRateLimit } = {};

  protected static readonly BODY_METHODS = new Set(['POST', 'PUT', 'PATCH']);

  protected saveRateLimit(originalUrl: string, rateLimit: TwitterRateLimit) {
    this._rateLimits[originalUrl] = rateLimit;
  }

  /**
   * Send a new request and returns a wrapped `Promise<TwitterResponse<T>`.
   *
   * The request URL should not contains a query string, prefers using `parameters` for GET request.
   * If you need to pass a body AND query string parameter, duplicate parameters in the body.
   */
  send<T = any>(requestParams: IGetHttpRequestArgs) : Promise<TwitterResponse<T>> {
    const args = this.getHttpRequestArgs(requestParams);
    const options = { method: args.method, headers: args.headers };
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
   * Send a new request, then creates a stream from its as a `Promise<TwitterStream>`.
   *
   * The request URL should not contains a query string, prefers using `parameters` for GET request.
   * If you need to pass a body AND query string parameter, duplicate parameters in the body.
   */
  sendStream<T = any>(requestParams: IGetHttpRequestArgs & IGetStreamRequestArgs) : Promise<TweetStream<T>> {
    const args = this.getHttpRequestArgs(requestParams);
    const options = { method: args.method, headers: args.headers };
    const enableRateLimitSave = requestParams.enableRateLimitSave !== false;

    if (args.body) {
      RequestParamHelpers.setBodyLengthHeader(options, args.body);
    }

    return new RequestHandlerHelper<T>({
      url: args.url,
      options,
      body: args.body,
      rateLimitSaver: enableRateLimitSave ? this.saveRateLimit.bind(this, args.rawUrl) : undefined,
      payloadIsError: requestParams.payloadIsError,
    })
      .makeRequestAsStream();
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
    else if (this._consumerSecret && this._oauth) {
      // Merge query and body
      const data = bodyInSignature ? RequestParamHelpers.mergeQueryAndBodyForOAuth(query, body) : query;

      const auth = this._oauth.authorize({
        url,
        method,
        data,
      }, this.getOAuthAccessTokens());

      headers = { ...headers, ...this._oauth.toHeader(auth) };
    }

    return headers;
  }

  protected getHttpRequestArgs({ url, method, query: rawQuery = {}, body: rawBody = {}, headers, forceBodyMode, enableAuth }: IGetHttpRequestArgs) {
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

    const query = RequestParamHelpers.formatQueryToString(rawQuery);
    url = RequestParamHelpers.mergeUrlQueryIntoObject(url, query);
    const rawUrl = url;

    // Delete undefined parameters
    if (!(rawBody instanceof Buffer)) {
      trimUndefinedProperties(rawBody);
    }

    // OAuth signature should not include parameters when using multipart.
    const bodyType = forceBodyMode ?? RequestParamHelpers.autoDetectBodyType(url);

    // If undefined or true, enable auth by headers
    if (enableAuth !== false) {
      // OAuth needs body signature only if body is URL encoded.
      const bodyInSignature = ClientRequestMaker.BODY_METHODS.has(method) && bodyType === 'url';

      headers = this.writeAuthHeaders({ headers, bodyInSignature, url, method, query, body: rawBody });
    }

    if (ClientRequestMaker.BODY_METHODS.has(method)) {
      body = RequestParamHelpers.constructBodyParams(rawBody, headers, bodyType) || undefined;
    }

    url += RequestParamHelpers.constructGetParams(query);

    return {
      rawUrl,
      url,
      method,
      headers,
      body,
    };
  }
}
