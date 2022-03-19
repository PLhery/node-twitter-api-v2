import { ApiPartialResponseError, ApiRequestError, ApiResponseError, IClientSettings, ITwitterApiClientPlugin, TClientTokens, TwitterRateLimit, TwitterResponse } from '../types';
import TweetStream from '../stream/TweetStream';
import type { ClientRequestArgs } from 'http';
import { trimUndefinedProperties } from '../helpers';
import OAuth1Helper from './oauth1.helper';
import RequestHandlerHelper from './request-handler.helper';
import RequestParamHelpers from './request-param.helper';
import { OAuth2Helper } from './oauth2.helper';
import type {
  IGetHttpRequestArgs,
  IGetStreamRequestArgs,
  IGetStreamRequestArgsAsync,
  IGetStreamRequestArgsSync,
  IWriteAuthHeadersArgs,
  TAcceptedInitToken,
  TRequestFullStreamData,
} from '../types/request-maker.mixin.types';
import { IComputedHttpRequestArgs } from '../types/request-maker.mixin.types';

export class ClientRequestMaker {
  // Public tokens
  public bearerToken?: string;
  public consumerToken?: string;
  public consumerSecret?: string;
  public accessToken?: string;
  public accessSecret?: string;
  public basicToken?: string;
  public clientId?: string;
  public clientSecret?: string;
  public rateLimits: { [endpoint: string]: TwitterRateLimit } = {};
  public clientSettings: Partial<IClientSettings> = {};

  // Private computed properties
  protected _oauth?: OAuth1Helper;

  protected static readonly BODY_METHODS = new Set(['POST', 'PUT', 'PATCH']);

  constructor(settings?: Partial<IClientSettings>) {
    if (settings) {
      this.clientSettings = settings;
    }
  }

  /** @deprecated - Switch to `@twitter-api-v2/plugin-rate-limit` */
  public getRateLimits() {
    return this.rateLimits;
  }

  protected saveRateLimit(originalUrl: string, rateLimit: TwitterRateLimit) {
    this.rateLimits[originalUrl] = rateLimit;
  }

  /** Send a new request and returns a wrapped `Promise<TwitterResponse<T>`. */
  public async send<T = any>(requestParams: IGetHttpRequestArgs) : Promise<TwitterResponse<T>> {
    // Pre-request config hooks
    if (this.clientSettings.plugins?.length) {
      const possibleResponse = await this.applyPreRequestConfigHooks(requestParams);

      if (possibleResponse) {
        return possibleResponse;
      }
    }

    const args = this.getHttpRequestArgs(requestParams);
    const options: Partial<ClientRequestArgs> = {
      method: args.method,
      headers: args.headers,
      timeout: requestParams.timeout,
      agent: this.clientSettings.httpAgent,
    };
    const enableRateLimitSave = requestParams.enableRateLimitSave !== false;

    if (args.body) {
      RequestParamHelpers.setBodyLengthHeader(options, args.body);
    }

    // Pre-request hooks
    if (this.clientSettings.plugins?.length) {
      await this.applyPreRequestHooks(requestParams, args, options);
    }

    const request = new RequestHandlerHelper<T>({
      url: args.url,
      options,
      body: args.body,
      rateLimitSaver: enableRateLimitSave ? this.saveRateLimit.bind(this, args.rawUrl) : undefined,
      requestEventDebugHandler: requestParams.requestEventDebugHandler,
      compression: requestParams.compression ?? this.clientSettings.compression ?? true,
      forceParseMode: requestParams.forceParseMode,
    })
      .makeRequest();

    if (this.clientSettings.plugins?.length) {
      this.applyResponseErrorHooks(requestParams, args, options, request);
    }

    const response = await request;

    // Post-request hooks
    if (this.clientSettings.plugins?.length) {
      await this.applyPostRequestHooks(requestParams, args, options, response);
    }

    return response;
  }

  /**
   * Create a new request, then creates a stream from it as a `TweetStream`.
   *
   * Request will be sent only if `autoConnect` is not set or `true`: return type will be `Promise<TweetStream>`.
   * If `autoConnect` is `false`, a `TweetStream` is directly returned and you should call `stream.connect()` by yourself.
   */
  public sendStream<T = any>(requestParams: IGetHttpRequestArgs & IGetStreamRequestArgsSync) : TweetStream<T>;
  public sendStream<T = any>(requestParams: IGetHttpRequestArgs & IGetStreamRequestArgsAsync) : Promise<TweetStream<T>>;
  public sendStream<T = any>(requestParams: IGetHttpRequestArgs & IGetStreamRequestArgs) : Promise<TweetStream<T>> | TweetStream<T>;

  public sendStream<T = any>(requestParams: IGetHttpRequestArgs & IGetStreamRequestArgs) : Promise<TweetStream<T>> | TweetStream<T> {
    // Pre-request hooks
    if (this.clientSettings.plugins) {
      this.applyPreStreamRequestConfigHooks(requestParams);
    }

    const args = this.getHttpRequestArgs(requestParams);
    const options: Partial<ClientRequestArgs> = {
      method: args.method,
      headers: args.headers,
      agent: this.clientSettings.httpAgent,
    };
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
      compression: requestParams.compression ?? this.clientSettings.compression ?? true,
    };

    const stream = new TweetStream<T>(requestData);

    if (!enableAutoConnect) {
      return stream;
    }
    return stream.connect();
  }


  /* Token helpers */

  public initializeToken(token?: TAcceptedInitToken) {
    if (typeof token === 'string') {
      this.bearerToken = token;
    }
    else if (typeof token === 'object' && 'appKey' in token) {
      this.consumerToken = token.appKey;
      this.consumerSecret = token.appSecret;

      if (token.accessToken && token.accessSecret) {
        this.accessToken = token.accessToken;
        this.accessSecret = token.accessSecret;
      }

      this._oauth = this.buildOAuth();
    }
    else if (typeof token === 'object' && 'username' in token) {
      const key = encodeURIComponent(token.username) + ':' + encodeURIComponent(token.password);
      this.basicToken = Buffer.from(key).toString('base64');
    }
    else if (typeof token === 'object' && 'clientId' in token) {
      this.clientId = token.clientId;
      this.clientSecret = token.clientSecret;
    }
  }

  public getActiveTokens(): TClientTokens {
    if (this.bearerToken) {
      return {
        type: 'oauth2',
        bearerToken: this.bearerToken,
      };
    }
    else if (this.basicToken) {
      return {
        type: 'basic',
        token: this.basicToken,
      };
    }
    else if (this.consumerSecret && this._oauth) {
      return {
        type: 'oauth-1.0a',
        appKey: this.consumerToken!,
        appSecret: this.consumerSecret!,
        accessToken: this.accessToken,
        accessSecret: this.accessSecret,
      };
    }
    else if (this.clientId) {
      return {
        type: 'oauth2-user',
        clientId: this.clientId!,
      };
    }
    return { type: 'none' };
  }

  protected buildOAuth() {
    if (!this.consumerSecret || !this.consumerToken)
      throw new Error('Invalid consumer tokens');

    return new OAuth1Helper({
      consumerKeys: { key: this.consumerToken, secret: this.consumerSecret },
    });
  }

  protected getOAuthAccessTokens() {
    if (!this.accessSecret || !this.accessToken)
      return;

    return {
      key: this.accessToken,
      secret: this.accessSecret,
    };
  }


  /* Plugin helpers */

  public getPlugins() {
    return this.clientSettings.plugins ?? [];
  }

  public hasPlugins() {
    return !!this.clientSettings.plugins?.length;
  }

  public async applyPluginMethod<K extends keyof ITwitterApiClientPlugin>(method: K, args: Parameters<Required<ITwitterApiClientPlugin>[K]>[0]) {
    for (const plugin of this.getPlugins()) {
      await plugin[method]?.(args as any);
    }
  }


  /* Request helpers */

  protected writeAuthHeaders({ headers, bodyInSignature, url, method, query, body }: IWriteAuthHeadersArgs) {
    headers = { ...headers };

    if (this.bearerToken) {
      headers.Authorization = 'Bearer ' + this.bearerToken;
    }
    else if (this.basicToken) {
      // Basic auth, to request a bearer token
      headers.Authorization = 'Basic ' + this.basicToken;
    }
    else if (this.clientId && this.clientSecret) {
      // Basic auth with clientId + clientSecret
      headers.Authorization = 'Basic ' + OAuth2Helper.getAuthHeader(this.clientId, this.clientSecret);
    }
    else if (this.consumerSecret && this._oauth) {
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

  protected getUrlObjectFromUrlString(url: string) {
    // Add protocol to URL if needed
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }

    // Convert URL to object that will receive all URL modifications
    return new URL(url);
  }

  protected getHttpRequestArgs({
    url: stringUrl, method, query: rawQuery = {},
    body: rawBody = {}, headers,
    forceBodyMode, enableAuth, params,
  }: IGetHttpRequestArgs): IComputedHttpRequestArgs {
    let body: string | Buffer | undefined = undefined;
    method = method.toUpperCase();
    headers = headers ?? {};

    // Add user agent header (Twitter recommends it)
    if (!headers['x-user-agent']) {
      headers['x-user-agent'] = 'Node.twitter-api-v2';
    }

    const url = this.getUrlObjectFromUrlString(stringUrl);
    // URL without query string to save as endpoint name
    const rawUrl = url.origin + url.pathname;

    // Apply URL parameters
    if (params) {
      RequestParamHelpers.applyRequestParametersToUrl(url, params);
    }

    // Build a URL without anything in QS, and QSP in query
    const query = RequestParamHelpers.formatQueryToString(rawQuery);
    RequestParamHelpers.moveUrlQueryParamsIntoObject(url, query);

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

      headers = this.writeAuthHeaders({ headers, bodyInSignature, method, query, url, body: rawBody });
    }

    if (ClientRequestMaker.BODY_METHODS.has(method)) {
      body = RequestParamHelpers.constructBodyParams(rawBody, headers, bodyType) || undefined;
    }

    RequestParamHelpers.addQueryParamsToUrl(url, query);

    return {
      rawUrl,
      url,
      method,
      headers,
      body,
    };
  }

  /* Plugin helpers */

  protected async applyPreRequestConfigHooks(requestParams: IGetHttpRequestArgs) {
    const url = this.getUrlObjectFromUrlString(requestParams.url);

    for (const plugin of this.getPlugins()) {
      const result = await plugin.onBeforeRequestConfig?.({
        url,
        params: requestParams,
      });

      if (result) {
        return result;
      }
    }
  }

  protected applyPreStreamRequestConfigHooks(requestParams: IGetHttpRequestArgs) {
    const url = this.getUrlObjectFromUrlString(requestParams.url);

    for (const plugin of this.getPlugins()) {
      plugin.onBeforeStreamRequestConfig?.({
        url,
        params: requestParams,
      });
    }
  }

  protected async applyPreRequestHooks(requestParams: IGetHttpRequestArgs, computedParams: IComputedHttpRequestArgs, requestOptions: Partial<ClientRequestArgs>) {
    await this.applyPluginMethod('onBeforeRequest', {
      url: this.getUrlObjectFromUrlString(requestParams.url),
      params: requestParams,
      computedParams,
      requestOptions,
    });
  }

  protected async applyPostRequestHooks(requestParams: IGetHttpRequestArgs, computedParams: IComputedHttpRequestArgs, requestOptions: Partial<ClientRequestArgs>, response: TwitterResponse<any>) {
    await this.applyPluginMethod('onAfterRequest', {
      url: this.getUrlObjectFromUrlString(requestParams.url),
      params: requestParams,
      computedParams,
      requestOptions,
      response,
    });
  }

  protected applyResponseErrorHooks(requestParams: IGetHttpRequestArgs, computedParams: IComputedHttpRequestArgs, requestOptions: Partial<ClientRequestArgs>, promise: Promise<TwitterResponse<any>>) {
    promise.catch((error: any) => {
      if (error instanceof ApiRequestError || error instanceof ApiPartialResponseError) {
        this.applyPluginMethod('onRequestError', {
          url: this.getUrlObjectFromUrlString(requestParams.url),
          params: requestParams,
          computedParams,
          requestOptions,
          error,
        });
      } else if (error instanceof ApiResponseError) {
        this.applyPluginMethod('onResponseError', {
          url: this.getUrlObjectFromUrlString(requestParams.url),
          params: requestParams,
          computedParams,
          requestOptions,
          error,
        });
      }

      return Promise.reject(error);
    });
  }
}
