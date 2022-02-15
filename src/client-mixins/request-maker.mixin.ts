import { IClientSettings, TwitterRateLimit, TwitterResponse } from '../types';
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
  TRequestFullStreamData,
} from '../types/request-maker.mixin.types';
import { IComputedHttpRequestArgs } from '../types/request-maker.mixin.types';

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
  protected _clientSettings: Partial<IClientSettings> = {};

  protected static readonly BODY_METHODS = new Set(['POST', 'PUT', 'PATCH']);

  protected saveRateLimit(originalUrl: string, rateLimit: TwitterRateLimit) {
    this._rateLimits[originalUrl] = rateLimit;
  }

  /** Send a new request and returns a wrapped `Promise<TwitterResponse<T>`. */
  async send<T = any>(requestParams: IGetHttpRequestArgs) : Promise<TwitterResponse<T>> {
    // Pre-request config hooks
    if (this._clientSettings.plugins) {
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
      agent: this._clientSettings.httpAgent,
    };
    const enableRateLimitSave = requestParams.enableRateLimitSave !== false;

    if (args.body) {
      RequestParamHelpers.setBodyLengthHeader(options, args.body);
    }

    // Pre-request hooks
    if (this._clientSettings.plugins) {
      await this.applyPreRequestHooks(requestParams, args);
    }

    const isCompressionDisabled = requestParams.disableCompression || this._clientSettings.disableCompression;

    const response = await new RequestHandlerHelper<T>({
      url: args.url,
      options,
      body: args.body,
      rateLimitSaver: enableRateLimitSave ? this.saveRateLimit.bind(this, args.rawUrl) : undefined,
      requestEventDebugHandler: requestParams.requestEventDebugHandler,
      compression: !isCompressionDisabled,
    })
      .makeRequest();

    // Post-request hooks
    if (this._clientSettings.plugins) {
      await this.applyPostRequestHooks(requestParams, args, response);
    }

    return response;
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
    // Pre-request hooks
    if (this._clientSettings.plugins) {
      this.applyPreStreamRequestConfigHooks(requestParams);
    }

    const args = this.getHttpRequestArgs(requestParams);
    const options: Partial<ClientRequestArgs> = {
      method: args.method,
      headers: args.headers,
      agent: this._clientSettings.httpAgent,
    };
    const enableRateLimitSave = requestParams.enableRateLimitSave !== false;
    const enableAutoConnect = requestParams.autoConnect !== false;

    if (args.body) {
      RequestParamHelpers.setBodyLengthHeader(options, args.body);
    }

    const isCompressionDisabled = requestParams.disableCompression || this._clientSettings.disableCompression;

    const requestData: TRequestFullStreamData = {
      url: args.url,
      options,
      body: args.body,
      rateLimitSaver: enableRateLimitSave ? this.saveRateLimit.bind(this, args.rawUrl) : undefined,
      payloadIsError: requestParams.payloadIsError,
      compression: !isCompressionDisabled,
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
    const rawUrl = method + ' ' + url.origin + url.pathname;

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
    const plugins = this._clientSettings.plugins!;
    const url = this.getUrlObjectFromUrlString(requestParams.url);

    for (const plugin of plugins) {
      const result = await plugin.onBeforeRequestConfig?.({
        client: this as any,
        plugin,
        url,
        params: requestParams,
      });

      if (result) {
        return result;
      }
    }
  }

  protected applyPreStreamRequestConfigHooks(requestParams: IGetHttpRequestArgs) {
    const plugins = this._clientSettings.plugins!;
    const url = this.getUrlObjectFromUrlString(requestParams.url);

    for (const plugin of plugins) {
      plugin.onBeforeStreamRequestConfig?.({
        client: this as any,
        plugin,
        url,
        params: requestParams,
      });
    }
  }

  protected async applyPreRequestHooks(requestParams: IGetHttpRequestArgs, computedParams: IComputedHttpRequestArgs) {
    const plugins = this._clientSettings.plugins!;
    const url = this.getUrlObjectFromUrlString(requestParams.url);

    for (const plugin of plugins) {
      await plugin.onBeforeRequest?.({
        client: this as any,
        plugin,
        url,
        params: requestParams,
        computedParams,
      });
    }
  }

  protected async applyPostRequestHooks(requestParams: IGetHttpRequestArgs, computedParams: IComputedHttpRequestArgs, response: TwitterResponse<any>) {
    const plugins = this._clientSettings.plugins!;
    const url = this.getUrlObjectFromUrlString(requestParams.url);

    for (const plugin of plugins) {
      await plugin.onAfterRequest?.({
        client: this as any,
        plugin,
        url,
        params: requestParams,
        computedParams,
        response,
      });
    }
  }
}
