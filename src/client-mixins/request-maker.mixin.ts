import { ApiRequestError, ApiResponseError, ErrorV1, ErrorV2, TwitterRateLimit, TwitterResponse } from '../types';
import TweetStream from '../stream/TweetStream';
import { URLSearchParams } from 'url';
import { request, RequestOptions } from 'https';
import { trimUndefinedProperties } from '../helpers';
import type { ClientRequest, IncomingMessage } from 'http';
import OAuth1Helper from './oauth1.helper';
import { TwitterApiV2Settings } from '../settings';
import { FormDataHelper } from './form-data.helper';

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

  static autoDetectBodyType(url: string) : TBodyMode {
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
    mode: TBodyMode,
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
    else if (mode === 'raw') {
      throw new Error('You can only use raw body mode with Buffers. To give a string, use Buffer.from(str).');
    }
    else {
      const form = new FormDataHelper();

      for (const parameter in body) {
        form.append(parameter, body[parameter]);
      }

      const formHeaders = form.getHeaders();
      headers['content-type'] = formHeaders['content-type'];

      return form.getBuffer();
    }
  }

  static setBodyLengthHeader(options: RequestOptions, body: string | Buffer) {
    options.headers = options.headers ?? {};

    if (typeof body === 'string') {
      options.headers['content-length'] = Buffer.byteLength(body);
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

type TRequestReadyPayload = { req: ClientRequest, res: IncomingMessage, requestData: TRequestFullData };
type TReadyRequestResolver = (value: TRequestReadyPayload) => void;
type TResponseResolver<T> = (value: TwitterResponse<T>) => void;
type TRequestRejecter = (error: ApiRequestError) => void;
type TResponseRejecter = (error: ApiResponseError) => void;

interface IBuildErrorParams {
  res: IncomingMessage;
  data: any;
  rateLimit?: TwitterRateLimit;
  code: number;
}

export class RequestHandlerHelper<T> {
  protected static readonly FORM_ENCODED_ENDPOINTS = 'https://api.twitter.com/oauth/';
  protected req!: ClientRequest;
  protected responseData = '';

  constructor(protected requestData: TRequestFullData) {}

  get href() {
    return this.requestData.url;
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

  protected createRequestError(error: Error): ApiRequestError {
    if (TwitterApiV2Settings.debug) {
      console.log('Request network error:', error);
    }

    return new ApiRequestError('Request failed.', {
      request: this.req,
      error,
    });
  }

  protected formatV1Errors(errors: ErrorV1[]) {
    return errors
      .map(({ code, message }) => `${message} (Twitter code ${code})`)
      .join(', ');
  }

  protected formatV2Errors(errors: ErrorV2[]) {
    return errors
      .map(({ type, title, detail }) => `${title}: ${detail} (see ${type})`)
      .join(', ');
  }

  protected createResponseError({ res, data, rateLimit, code }: IBuildErrorParams): ApiResponseError {
    if (TwitterApiV2Settings.debug) {
      console.log('Request failed with code', code, ', data:', data, 'response headers:', res.headers);
    }

    // Errors formatting.
    let errorString = `Request failed with code ${code}`;
    if (data?.errors?.length) {
      const errors = data.errors as (ErrorV1 | ErrorV2)[];

      if ('code' in errors[0]) {
        errorString += ' - ' + this.formatV1Errors(errors as ErrorV1[]);
      }
      else {
        errorString += ' - ' + this.formatV2Errors(errors as ErrorV2[]);
      }
    }

    return new ApiResponseError(errorString, {
      code,
      data,
      headers: res.headers,
      request: this.req,
      response: res,
      rateLimit,
    });
  }

  protected registerRequestErrorHandler(reject: TRequestRejecter) {
    return (requestError: Error) => {
      reject(this.createRequestError(requestError));
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
        if (code >= 400) {
          reject(this.createResponseError({ data, res, rateLimit, code }));
        }

        resolve({
          data,
          headers: res.headers,
          rateLimit
        });
      });
    };
  }

  protected registerStreamResponseHandler(resolve: TReadyRequestResolver, reject: TResponseRejecter) {
    return (res: IncomingMessage) => {
      const code = res.statusCode!;

      if (code < 400) {
        // HTTP code ok, consume stream
        resolve({ req: this.req, res, requestData: this.requestData });
      }
      else {
        // Handle response normally, can only rejects
        this.registerResponseHandler(() => undefined, reject)(res);
      }
    };
  }

  protected debugRequest() {
    console.log(
      'Request to', this.requestData.url, 'will be made.',
      'Options:', this.requestData.options,
      'body:', this.requestData.body,
    );
  }

  protected buildRequest() {
    if (TwitterApiV2Settings.debug) {
      this.debugRequest();
    }
    this.req = request(this.requestData.url, this.requestData.options);
  }

  makeRequest() {
    this.buildRequest();

    return new Promise<TwitterResponse<T>>((resolve, reject) => {
      const req = this.req;

      // Handle request errors
      req.on('error', this.registerRequestErrorHandler(reject));

      req.on('response', this.registerResponseHandler(resolve, reject));

      if (this.requestData.body) {
        req.write(this.requestData.body);
      }

      req.end();
    });
  }

  async makeRequestAsStream() {
    const { req, res, requestData } = await this.makeRequestAndResolveWhenReady();
    return new TweetStream<T>(req, res, requestData);
  }

  makeRequestAndResolveWhenReady() {
    this.buildRequest();

    return new Promise<TRequestReadyPayload>((resolve, reject) => {
      const req = this.req;

      // Handle request errors
      req.on('error', this.registerRequestErrorHandler(reject));

      req.on('response', this.registerStreamResponseHandler(resolve, reject));

      if (this.requestData.body) {
        req.write(this.requestData.body);
      }

      req.end();
    });
  }
}
