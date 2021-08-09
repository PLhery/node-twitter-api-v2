import { TwitterResponse } from '../types';
import TweetStream from '../stream/TweetStream';
import type { RequestOptions } from 'https';
import { trimUndefinedProperties } from '../helpers';
import OAuth1Helper from './oauth1.helper';
import RequestHandlerHelper from './request-handler.helper';
import RequestParamHelpers from './request-param.helper';

export type TRequestFullData = { url: string, options: RequestOptions, body?: any };
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
}

export type TCustomizableRequestArgs = Pick<IGetHttpRequestArgs, 'headers' | 'forceBodyMode'>;

export abstract class ClientRequestMaker {
  protected _bearerToken?: string;
  protected _consumerToken?: string;
  protected _consumerSecret?: string;
  protected _accessToken?: string;
  protected _accessSecret?: string;
  protected _basicToken?: string;
  protected _oauth?: OAuth1Helper;

  protected static readonly BODY_METHODS = new Set(['POST', 'PUT', 'PATCH']);

  /**
   * Send a new request and returns a wrapped `Promise<TwitterResponse<T>`.
   *
   * The request URL should not contains a query string, prefers using `parameters` for GET request.
   * If you need to pass a body AND query string parameter, duplicate parameters in the body.
   */
  send<T = any>(options: IGetHttpRequestArgs) : Promise<TwitterResponse<T>> {
    const args = this.getHttpRequestArgs(options);

    return this.httpSend(
      args.url,
      {
        method: args.method,
        headers: args.headers,
      },
      args.body,
    );
  }

  /**
   * Send a new request, then creates a stream from its as a `Promise<TwitterStream>`.
   *
   * The request URL should not contains a query string, prefers using `parameters` for GET request.
   * If you need to pass a body AND query string parameter, duplicate parameters in the body.
   */
  sendStream<T = any>(options: IGetHttpRequestArgs) : Promise<TweetStream<T>> {
    const args = this.getHttpRequestArgs(options);

    return this.httpStream(
      args.url,
      {
        method: args.method,
        headers: args.headers,
      },
      args.body,
    );
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

  protected getHttpRequestArgs({ url, method, query: rawQuery = {}, body: rawBody = {}, headers, forceBodyMode }: IGetHttpRequestArgs) {
    let body: string | Buffer | undefined = undefined;
    method = method.toUpperCase();
    headers = headers ?? {};

    // Add user agent header (Twitter recommands it)
    if (!headers['x-user-agent']) {
      headers['x-user-agent'] = 'Node.twitter-api-v2';
    }

    const query = RequestParamHelpers.formatQueryToString(rawQuery);
    url = RequestParamHelpers.mergeUrlQueryIntoObject(url, query);

    // Delete undefined parameters
    if (!(rawBody instanceof Buffer)) {
      trimUndefinedProperties(rawBody);
    }

    // OAuth signature should not include parameters when using multipart.
    const bodyType = forceBodyMode ?? RequestParamHelpers.autoDetectBodyType(url);
    // OAuth needs body signature only if body is URL encoded.
    const bodyInSignature = ClientRequestMaker.BODY_METHODS.has(method) && bodyType === 'url';

    headers = this.writeAuthHeaders({ headers, bodyInSignature, url, method, query, body: rawBody });

    if (ClientRequestMaker.BODY_METHODS.has(method)) {
      body = RequestParamHelpers.constructBodyParams(rawBody, headers, bodyType) || undefined;
    }

    url += RequestParamHelpers.constructGetParams(query);

    return {
      url,
      method,
      headers,
      body,
    };
  }

  protected httpSend<T = any>(url: string, options: RequestOptions, body?: string | Buffer) : Promise<TwitterResponse<T>> {
    if (body) {
      RequestParamHelpers.setBodyLengthHeader(options, body);
    }

    return new RequestHandlerHelper<T>({ url, options, body })
      .makeRequest();
  }

  protected httpStream<T = any>(url: string, options: RequestOptions, body?: string | Buffer) : Promise<TweetStream> {
    if (body) {
      RequestParamHelpers.setBodyLengthHeader(options, body);
    }

    return new RequestHandlerHelper<T>({ url, options, body })
      .makeRequestAsStream();
  }
}
