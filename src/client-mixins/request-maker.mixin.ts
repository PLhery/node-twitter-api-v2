import { ETwitterApiError, TwitterApiError, TwitterApiRequestError, TwitterRateLimit, TwitterResponse } from '../types';
import TweetStream from '../stream/TweetStream';
import { URLSearchParams } from 'url';
import FormData from 'form-data';
import { request, RequestOptions } from 'https';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import { trimUndefinedProperties } from '../helpers';
import type { ClientRequest, IncomingMessage } from 'http';

export type TRequestQuery = Record<string, string | number | boolean | undefined>;
export type TRequestStringQuery = Record<string, string>;
export type TRequestBody = Record<string, any> | Buffer;

interface IWriteAuthHeadersArgs {
  headers: Record<string, string>;
  isMultipart: boolean;
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
}

export type TCustomizableRequestArgs = Pick<IGetHttpRequestArgs, 'headers'>;

export abstract class ClientRequestMaker {
  protected _bearerToken?: string;
  protected _consumerToken?: string;
  protected _consumerSecret?: string;
  protected _accessToken?: string;
  protected _accessSecret?: string;
  protected _basicToken?: string;
  protected _oauth?: OAuth;

  protected static readonly BODY_METHODS = new Set(['POST', 'PUT', 'PATCH']);

  /**
   * Send a new request and returns a wrapped `Promise<TwitterResponse<T>`.
   *
   * The request URL should not contains a query string, prefers using `parameters` for GET request.
   * If you need to pass a body AND query string parameter, duplicate parameters in the body.
   */
  send<T = any>({ url, method, query = {}, body, headers }: IGetHttpRequestArgs) : Promise<TwitterResponse<T>> {
    const args = this.getHttpRequestArgs({ url, method, query, body, headers });

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
  sendStream({ url, method, query = {}, body, headers }: IGetHttpRequestArgs) : Promise<TweetStream> {
    const args = this.getHttpRequestArgs({ url, method, query, body, headers });

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

    return new OAuth({
      consumer: { key: this._consumerToken, secret: this._consumerSecret },
      signature_method: 'HMAC-SHA1',
      hash_function(base_string, key) {
        return crypto
          .createHmac('sha1', key)
          .update(base_string)
          .digest('base64')
      },
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

  protected writeAuthHeaders({ headers, isMultipart, url, method, query, body }: IWriteAuthHeadersArgs) {
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
      const data = isMultipart ? {} : RequestParamHelpers.mergeQueryAndBodyForOAuth(query, body);

      const auth = this._oauth.authorize({
        url,
        method,
        data,
      }, this.getOAuthAccessTokens());

      headers = { ...headers, ...this._oauth.toHeader(auth) };
    }

    return headers;
  }

  protected getHttpRequestArgs({ url, method, query: rawQuery = {}, body: rawBody = {}, headers }: IGetHttpRequestArgs) {
    let body: string | Buffer | undefined = undefined;
    method = method.toUpperCase();
    headers = headers ?? {};

    const query = RequestParamHelpers.formatQueryToString(rawQuery);
    url = RequestParamHelpers.mergeUrlQueryIntoObject(url, query);

    // Delete undefined parameters
    if (!(rawBody instanceof Buffer)) {
      trimUndefinedProperties(rawBody);
    }

    // OAuth signature should not include parameters when using multipart.
    const bodyType = RequestParamHelpers.autoDetectBodyType(url);
    const isMultipart = ClientRequestMaker.BODY_METHODS.has(method) && bodyType === 'form-data';

    headers = this.writeAuthHeaders({ headers, isMultipart, url, method, query, body: rawBody });

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

    return new RequestHandlerHelper<T>(request(url, options))
      .makeRequest(body);
  }

  protected httpStream(url: string, options: RequestOptions, body?: string | Buffer) : Promise<TweetStream> {
    if (body) {
      RequestParamHelpers.setBodyLengthHeader(options, body);
    }

    return new RequestHandlerHelper(request(url, options))
      .makeRequestAsStream(body);
  }
}

/* Helpers functions that are specific to this class but do not depends on instance */

class RequestParamHelpers {
  static readonly JSON_1_1_ENDPOINTS = new Set([
    'direct_messages/events/new',
    'direct_messages/welcome_messages/new',
    'direct_messages/welcome_messages/rules/new',
    'media/metadata/create',
    'collections/entries/curate',
  ]);

  static formatQueryToString(query: TRequestQuery) {
    const formattedQuery: TRequestStringQuery = {};

    for (const prop in query) {
      if (typeof query[prop] === 'string') {
        formattedQuery[prop] = query[prop] as string;
      }
      else if (typeof query[prop] !== 'undefined') {
        formattedQuery[prop] = String(query[prop]);
      }
    }

    return formattedQuery;
  }

  static autoDetectBodyType(url: string) : 'json' | 'url' | 'form-data' {
    if (url.includes('.twitter.com/2')) {
      // Twitter API v2 always has JSON-encoded requests, right?
      return 'json';
    }

    if (url.startsWith('https://upload.twitter.com/1.1/media')) {
      return 'form-data';
    }

    const endpoint = url.split('.twitter.com/1.1/', 2)[1];

    if (this.JSON_1_1_ENDPOINTS.has(endpoint)) {
      return 'json';
    }
    return 'url';
  }

  static constructGetParams(query: TRequestQuery) {
    if (Object.keys(query).length)
      return '?' + new URLSearchParams(query as Record<string, string>).toString();

    return '';
  }

  static constructBodyParams(
    body: TRequestBody,
    headers: Record<string, string>,
    mode: 'json' | 'url' | 'form-data'
  ) {
    if (body instanceof Buffer) {
      return body;
    }

    if (mode === 'json') {
      headers['content-type'] = 'application/json;charset=UTF-8';
      return JSON.stringify(body);
    }
    else if (mode === 'url') {
      headers['content-type'] = 'application/x-www-form-urlencoded;charset=UTF-8';

      if (Object.keys(body).length)
        return new URLSearchParams(body).toString();

      return '';
    }
    else {
      const form = new FormData();

      for (const parameter in body) {
        form.append(parameter, body[parameter]);
      }

      const formHeaders = form.getHeaders();
      for (const item in formHeaders) {
        headers[item] = formHeaders[item];
      }

      return form.getBuffer();
    }
  }

  static setBodyLengthHeader(options: RequestOptions, body: string | Buffer) {
    options.headers = options.headers ?? {};

    if (typeof body === 'string') {
      const encoder = new TextEncoder();
      options.headers['content-length'] = encoder.encode(body).length;
    }
    else {
      options.headers['content-length'] = body.length;
    }
  }

  static isOAuthSerializable(item: any) {
    return !(item instanceof Buffer);
  }

  static mergeQueryAndBodyForOAuth(query: TRequestQuery, body: TRequestBody) {
    const parameters: any = {};

    for (const prop in query) {
      parameters[prop] = query[prop];
    }

    if (this.isOAuthSerializable(body)) {
      for (const prop in body) {
        const bodyProp = (body as any)[prop];

        if (this.isOAuthSerializable(bodyProp)) {
          parameters[prop] = bodyProp;
        }
      }
    }

    return parameters;
  }

  static mergeUrlQueryIntoObject(url: string, query: TRequestQuery) {
    const urlObject = new URL(url);

    for (const [param, value] of urlObject.searchParams) {
      query[param] = value;
    }

    // Remove the query string
    return urlObject.href.slice(0, urlObject.href.length - urlObject.search.length);
  }
}

type TResponseResolver<T> = (value: TwitterResponse<T>) => void;
type TStreamResponseResolver = (value: TweetStream) => void;
type TRequestRejecter = (error: TwitterApiRequestError) => void;
type TResponseRejecter = (error: TwitterApiError) => void;

class RequestHandlerHelper<T> {
  protected static readonly FORM_ENCODED_ENDPOINTS = 'https://api.twitter.com/oauth/';
  protected responseData = '';

  constructor(protected req: ClientRequest) {}

  get href() {
    return this.req.host + this.req.path;
  }

  protected isFormEncodedEndpoint() {
    return this.href.startsWith(RequestHandlerHelper.FORM_ENCODED_ENDPOINTS);
  }

  protected getRateLimitFromResponse(res: IncomingMessage) {
    let rateLimit: TwitterRateLimit | undefined = undefined;

    if (res.headers['x-rate-limit-limit']) {
      rateLimit = {
        limit: Number(res.headers['x-rate-limit-limit']),
        remaining: Number(res.headers['x-rate-limit-remaining']),
        reset: Number(res.headers['x-rate-limit-reset']),
      };
    }

    return rateLimit;
  }

  protected registerRequestErrorHandler(reject: TRequestRejecter) {
    return (requestError: Error) => {
      reject({
        type: ETwitterApiError.Request,
        error: true,
        raw: {
          request: this.req,
        },
        requestError,
      });
    };
  }

  protected registerResponseHandler(resolve: TResponseResolver<T>, reject: TResponseRejecter) {
    return (res: IncomingMessage) => {
      const rateLimit = this.getRateLimitFromResponse(res);

      // Register the response data
      res.on('data', chunk => this.responseData += chunk);

      res.on('end', () => {
        let data: any = this.responseData;

        // Auto parse if server responds with JSON body
        if (data.length && res.headers['content-type']?.includes('application/json')) {
          data = JSON.parse(data);
        }
        // f-e oauth token endpoints
        else if (this.isFormEncodedEndpoint()) {
          const response_form_entries: any = {};

          for (const [item, value] of new URLSearchParams(data)) {
            response_form_entries[item] = value;
          }

          data = response_form_entries;
        }

        // Handle bad error codes
        const code = res.statusCode!;
        if (code >= 400 || (typeof data === 'object' && 'errors' in data)) {
          reject({
            type: ETwitterApiError.Response,
            data,
            headers: res.headers,
            rateLimit,
            code,
            error: true,
            raw: {
              request: this.req,
              response: res,
            },
          });
        }

        resolve({
          data,
          headers: res.headers,
          rateLimit
        });
      });
    };
  }

  protected registerStreamResponseHandler(resolve: TStreamResponseResolver, reject: TResponseRejecter) {
    return (res: IncomingMessage) => {
      const code = res.statusCode!;

      if (code < 400) {
        // HTTP code ok, consume stream
        resolve(new TweetStream(this.req, res));
      }
      else {
        // Handle response normally, can only rejects
        this.registerResponseHandler(() => undefined, reject)(res);
      }
    };
  }

  makeRequest(body?: any) {
    return new Promise<TwitterResponse<T>>((resolve, reject) => {
      const req = this.req;

      // Handle request errors
      req.on('error', this.registerRequestErrorHandler(reject));

      req.on('response', this.registerResponseHandler(resolve, reject));

      if (body) {
        req.write(body);
      }

      req.end();
    });
  }

  makeRequestAsStream(body?: any) {
    return new Promise<TweetStream>((resolve, reject) => {
      const req = this.req;

      // Handle request errors
      req.on('error', this.registerRequestErrorHandler(reject));

      req.on('response', this.registerStreamResponseHandler(resolve, reject));

      if (body) {
        req.write(body);
      }

      req.end();
    });
  }
}
