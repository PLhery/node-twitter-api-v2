import { request } from 'https';
import { TwitterApiV2Settings } from '../settings';
import TweetStream from '../stream/TweetStream';
import { ApiPartialResponseError, ApiRequestError, ApiResponseError } from '../types';
import type { ErrorV1, ErrorV2, TwitterRateLimit, TwitterResponse } from '../types';
import type { TRequestFullData, TRequestFullStreamData } from './request-maker.mixin';
import type { IncomingMessage, ClientRequest } from 'http';

type TRequestReadyPayload = { req: ClientRequest, res: IncomingMessage, requestData: TRequestFullData | TRequestFullStreamData };
type TReadyRequestResolver = (value: TRequestReadyPayload) => void;
type TResponseResolver<T> = (value: TwitterResponse<T>) => void;
type TRequestRejecter = (error: ApiRequestError) => void;
type TResponseRejecter = (error: ApiResponseError | ApiPartialResponseError) => void;

interface IBuildErrorParams {
  res: IncomingMessage;
  data: any;
  rateLimit?: TwitterRateLimit;
  code: number;
}

export class RequestHandlerHelper<T> {
  protected req!: ClientRequest;
  protected res!: IncomingMessage;
  protected responseData = '';

  constructor(protected requestData: TRequestFullData | TRequestFullStreamData) {}

  get hrefPathname() {
    const url = this.requestData.url;
    return url.hostname + url.pathname;
  }

  protected isFormEncodedEndpoint() {
    return this.requestData.url.href.startsWith('https://api.twitter.com/oauth/');
  }

  protected getRateLimitFromResponse(res: IncomingMessage) {
    let rateLimit: TwitterRateLimit | undefined = undefined;

    if (res.headers['x-rate-limit-limit']) {
      rateLimit = {
        limit: Number(res.headers['x-rate-limit-limit']),
        remaining: Number(res.headers['x-rate-limit-remaining']),
        reset: Number(res.headers['x-rate-limit-reset']),
      };

      if (this.requestData.rateLimitSaver) {
        this.requestData.rateLimitSaver(rateLimit);
      }
    }

    return rateLimit;
  }

  protected createRequestError(error: Error): ApiRequestError {
    if (TwitterApiV2Settings.debug) {
      TwitterApiV2Settings.logger.log('Request error:', error);
    }

    return new ApiRequestError('Request failed.', {
      request: this.req,
      error,
    });
  }

  protected createPartialResponseError(error: Error, abortClose: boolean): ApiPartialResponseError {
    const res = this.res;
    let message = `Request failed with partial response with HTTP code ${res.statusCode}`;

    if (abortClose) {
      message += ' (connection closed by Twitter)';
    } else {
      message += ' (parse error)';
    }

    return new ApiPartialResponseError(message, {
      request: this.req,
      response: this.res,
      responseError: error,
      rawContent: this.responseData,
    });
  }

  protected formatV1Errors(errors: ErrorV1[]) {
    return errors
      .map(({ code, message }) => `${message} (Twitter code ${code})`)
      .join(', ');
  }

  protected formatV2Error(error: ErrorV2) {
    return `${error.title}: ${error.detail} (see ${error.type})`;
  }

  protected createResponseError({ res, data, rateLimit, code }: IBuildErrorParams): ApiResponseError {
    if (TwitterApiV2Settings.debug) {
      TwitterApiV2Settings.logger.log(`Request failed with code ${code}, data:`, data);
      TwitterApiV2Settings.logger.log('Response headers:', res.headers);
    }

    // Errors formatting.
    let errorString = `Request failed with code ${code}`;
    if (data?.errors?.length) {
      const errors = data.errors as (ErrorV1 | ErrorV2)[];

      if ('code' in errors[0]) {
        errorString += ' - ' + this.formatV1Errors(errors as ErrorV1[]);
      }
      else {
        errorString += ' - ' + this.formatV2Error(data as ErrorV2);
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

  protected getParsedResponse(res: IncomingMessage) {
    let data: any = this.responseData;

    // Auto parse if server responds with JSON body
    if (data.length && res.headers['content-type']?.includes('application/json')) {
      data = JSON.parse(data);
    }
    // f-e oauth token endpoints
    else if (this.isFormEncodedEndpoint()) {
      const formEntries: any = {};

      for (const [item, value] of new URLSearchParams(data)) {
        formEntries[item] = value;
      }

      data = formEntries;
    }

    return data;
  }

  protected requestErrorHandler(reject: TRequestRejecter, requestError: Error) {
    this.requestData.debug?.stepLogger('request-error', { uuid: this.requestData.debug.uuid, requestError })

    reject(this.createRequestError(requestError));
    this.req.removeAllListeners('timeout');
  }

  protected timeoutErrorHandler() {
    this.req.destroy(new Error('Request timeout.'));
  }

  protected classicResponseHandler(resolve: TResponseResolver<T>, reject: TResponseRejecter, res: IncomingMessage) {
    this.res = res;
    this.requestData.debug?.stepLogger('response', { uuid: this.requestData.debug.uuid, res })

    if (this.requestData.debug) {
      res.on('aborted', error => this.requestData.debug?.stepLogger('response-aborted', { uuid: this.requestData.debug.uuid, error }))
      res.on('error', error => this.requestData.debug?.stepLogger('response-error', { uuid: this.requestData.debug.uuid, error }))
      res.on('close', () => this.requestData.debug?.stepLogger('response-close', { uuid: this.requestData.debug.uuid, data: this.responseData }))
      res.on('end', () => this.requestData.debug?.stepLogger('response-end', { uuid: this.requestData.debug.uuid }))
    }

    // Register the response data
    res.on('data', chunk => this.responseData += chunk);
    res.on('end', this.onResponseEndHandler.bind(this, resolve, reject));
    res.on('close', this.onResponseCloseHandler.bind(this, resolve, reject));
  }

  protected onResponseEndHandler(resolve: TResponseResolver<T>, reject: TResponseRejecter) {
    this.req.removeAllListeners('timeout');
    const rateLimit = this.getRateLimitFromResponse(this.res);
    let data: any;

    try {
      data = this.getParsedResponse(this.res);
    } catch (e) {
      reject(this.createPartialResponseError(e as Error, false));
      return;
    }

    // Handle bad error codes
    const code = this.res.statusCode!;
    if (code >= 400) {
      reject(this.createResponseError({ data, res: this.res, rateLimit, code }));
      return;
    }

    if (TwitterApiV2Settings.debug) {
      TwitterApiV2Settings.logger.log(`[${this.requestData.options.method} ${this.hrefPathname}]: Request succeeds with code ${this.res.statusCode}`);
      TwitterApiV2Settings.logger.log('Response body:', data);
    }

    resolve({
      data,
      headers: this.res.headers,
      rateLimit,
    });
  }

  protected onResponseCloseHandler(resolve: TResponseResolver<T>, reject: TResponseRejecter) {
    this.req.removeAllListeners('timeout');
    const res = this.res;

    if (res.aborted) {
      // Try to parse the request (?)
      try {
        this.getParsedResponse(this.res);
        // Ok, try to resolve normally the request
        return this.onResponseEndHandler(resolve, reject);
      } catch (e) {}

      // Parse error, just drop with content
      return reject(this.createPartialResponseError(
        new Error('Response has been interrupted and partial response could not be parsed.'),
        true,
      ));
    }
    if (!res.complete) {
      return reject(this.createPartialResponseError(
        new Error('Response has been interrupted before response could be parsed.'),
        true,
      ));
    }

    // else: end has been called
  }

  protected streamResponseHandler(resolve: TReadyRequestResolver, reject: TResponseRejecter, res: IncomingMessage) {
    const code = res.statusCode!;

    if (code < 400) {
      if (TwitterApiV2Settings.debug) {
        TwitterApiV2Settings.logger.log(`[${this.requestData.options.method} ${this.hrefPathname}]: Request succeeds with code ${res.statusCode} (starting stream)`);
      }

      // HTTP code ok, consume stream
      resolve({ req: this.req, res, requestData: this.requestData });
    }
    else {
      // Handle response normally, can only rejects
      this.classicResponseHandler(() => undefined, reject, res);
    }
  }

  protected debugRequest() {
    const url = this.requestData.url;

    TwitterApiV2Settings.logger.log(`[${this.requestData.options.method} ${this.hrefPathname}]`, this.requestData.options);
    if (url.search) {
      TwitterApiV2Settings.logger.log('Request parameters:', [...url.searchParams.entries()].map(([key, value]) => `${key}: ${value}`));
    }
    if (this.requestData.body) {
      TwitterApiV2Settings.logger.log('Request body:', this.requestData.body);
    }
  }

  protected buildRequest() {
    if (TwitterApiV2Settings.debug) {
      this.debugRequest();
    }

    const url = this.requestData.url;
    const auth = url.username ? `${url.username}:${url.password}` : undefined;

    this.req = request({
      ...this.requestData.options,
      // Define URL params manually, addresses dependencies error https://github.com/PLhery/node-twitter-api-v2/issues/94
      host: url.hostname,
      port: url.port || undefined,
      path: url.pathname + url.search,
      protocol: url.protocol,
      auth,
    });
  }

  makeRequest() {
    this.buildRequest();

    return new Promise<TwitterResponse<T>>((resolve, reject) => {
      const req = this.req;

      // Handle request errors
      req.on('error', this.requestErrorHandler.bind(this, reject));

      if (this.requestData.debug) {
        req.on('abort', () => this.requestData.debug?.stepLogger('abort', { uuid: this.requestData.debug.uuid }))

        req.on('socket', socket => {
          this.requestData.debug?.stepLogger('socket', { uuid: this.requestData.debug.uuid, socket })

          socket.on('error', error => this.requestData.debug?.stepLogger('socket-error', { uuid: this.requestData.debug.uuid, socket, error }))
          socket.on('connect', () => this.requestData.debug?.stepLogger('socket-connect', { uuid: this.requestData.debug.uuid, socket }))
          socket.on('close', withError => this.requestData.debug?.stepLogger('socket-close', { uuid: this.requestData.debug.uuid, socket, withError }))
          socket.on('end', () => this.requestData.debug?.stepLogger('socket-end', { uuid: this.requestData.debug.uuid, socket }))
          socket.on('lookup', (...data) => this.requestData.debug?.stepLogger('socket-lookup', { uuid: this.requestData.debug.uuid, socket, data }))
          socket.on('timeout', () => this.requestData.debug?.stepLogger('socket-timeout', { uuid: this.requestData.debug.uuid, socket }))
        })
      }

      req.on('response', this.classicResponseHandler.bind(this, resolve, reject));

      if (this.requestData.options.timeout) {
        req.on('timeout', this.timeoutErrorHandler.bind(this));
      }

      if (this.requestData.body) {
        req.write(this.requestData.body);
      }

      req.end();
    });
  }

  async makeRequestAsStream() {
    const { req, res, requestData } = await this.makeRequestAndResolveWhenReady();
    return new TweetStream<T>(requestData as TRequestFullStreamData, req, res);
  }

  makeRequestAndResolveWhenReady() {
    this.buildRequest();

    return new Promise<TRequestReadyPayload>((resolve, reject) => {
      const req = this.req;

      // Handle request errors
      req.on('error', this.requestErrorHandler.bind(this, reject));

      req.on('response', this.streamResponseHandler.bind(this, resolve, reject));

      if (this.requestData.body) {
        req.write(this.requestData.body);
      }

      req.end();
    });
  }
}

export default RequestHandlerHelper;
