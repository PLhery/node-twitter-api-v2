import { TClientTokens, TwitterApiBasicAuth, TwitterApiOAuth2Init, TwitterApiTokens, TwitterRateLimit, TwitterResponse, UserV1 } from './types';
import {
  ClientRequestMaker,
  TCustomizableRequestArgs,
  TRequestBody,
  TRequestQuery,
} from './client-mixins/request-maker.mixin';
import TweetStream from './stream/TweetStream';

export type TGetClientRequestArgs = TCustomizableRequestArgs & {
  prefix?: string;
  fullResponse?: boolean;
};

type TGetClientRequestArgsFullResponse = TClientRequestArgs & { fullResponse: true };
type TGetClientRequestArgsDataResponse = TClientRequestArgs & { fullResponse?: false };

export type TClientRequestArgs = TCustomizableRequestArgs & {
  prefix?: string;
  fullResponse?: boolean;
  query?: TRequestQuery;
};

type TClientRequestArgsFullResponse = TClientRequestArgs & { fullResponse: true };
type TClientRequestArgsDataResponse = TClientRequestArgs & { fullResponse?: false };

export type TStreamClientRequestArgs = TCustomizableRequestArgs & {
  prefix?: string;
  query?: TRequestQuery;
  payloadIsError?: (data: any) => boolean;
  /**
   * Choose to make or not initial connection.
   * Method `.connect` must be called on returned `TweetStream` object
   * to start stream if `autoConnect` is set to `false`.
   * Defaults to `true`.
   */
  autoConnect?: boolean;
};

export type TStreamClientRequestArgsWithAutoConnect = TStreamClientRequestArgs & { autoConnect?: true };
export type TStreamClientRequestArgsWithoutAutoConnect = TStreamClientRequestArgs & { autoConnect: false };

/**
 * Base class for Twitter instances
 */
export default abstract class TwitterApiBase extends ClientRequestMaker {
  protected _prefix: string | undefined;
  protected _currentUser: UserV1 | null = null;

  /**
   * Create a new TwitterApi object without authentification.
   */
  constructor();
  /**
   * Create a new TwitterApi object with OAuth 2.0 Bearer authentification.
   */
  constructor(bearerToken: string);
  /**
   * Create a new TwitterApi object with three-legged OAuth 1.0a authentification.
   */
  constructor(tokens: TwitterApiTokens);
  /**
   * Create a new TwitterApi object with only client ID needed for OAuth2 user-flow.
   */
  constructor(oauth2Init: TwitterApiOAuth2Init);
  /**
   * Create a new TwitterApi object with Basic HTTP authentification.
   */
  constructor(credentials: TwitterApiBasicAuth);
  /**
   * Create a clone of {instance}.
   */
  constructor(instance: TwitterApiBase);

  public constructor(token?: TwitterApiTokens | TwitterApiOAuth2Init | TwitterApiBasicAuth | string | TwitterApiBase) {
    super();

    if (typeof token === 'string') {
      this._bearerToken = token;
    }
    else if (token instanceof TwitterApiBase) {
      this._accessToken = token._accessToken;
      this._accessSecret = token._accessSecret;
      this._consumerToken = token._consumerToken;
      this._consumerSecret = token._consumerSecret;
      this._oauth = token._oauth;
      this._prefix = token._prefix;
      this._bearerToken = token._bearerToken;
      this._basicToken = token._basicToken;
      this._clientId = token._clientId;
    }
    else if (typeof token === 'object' && 'appKey' in token) {
      this._consumerToken = token.appKey;
      this._consumerSecret = token.appSecret;

      if (token.accessToken && token.accessSecret) {
        this._accessToken = token.accessToken;
        this._accessSecret = token.accessSecret;
      }

      this._oauth = this.buildOAuth();
    }
    else if (typeof token === 'object' && 'username' in token) {
      const key = encodeURIComponent(token.username) + ':' + encodeURIComponent(token.password);
      this._basicToken = Buffer.from(key).toString('base64');
    }
    else if (typeof token === 'object' && 'clientId' in token) {
      this._clientId = token.clientId;
    }
  }

  /* Prefix/Token handling */

  protected setPrefix(prefix: string | undefined) {
    this._prefix = prefix;
  }

  public cloneWithPrefix(prefix: string): this {
    const clone = (this.constructor as any)(this);
    (clone as TwitterApiBase).setPrefix(prefix);

    return clone;
  }

  public getActiveTokens(): TClientTokens {
    if (this._bearerToken) {
      return {
        type: 'oauth2',
        bearerToken: this._bearerToken,
      };
    }
    else if (this._basicToken) {
      return {
        type: 'basic',
        token: this._basicToken,
      };
    }
    else if (this._consumerSecret && this._oauth) {
      return {
        type: 'oauth-1.0a',
        appKey: this._consumerToken!,
        appSecret: this._consumerSecret!,
        accessToken: this._accessToken,
        accessSecret: this._accessSecret,
      };
    }
    return { type: 'none' };
  }

  /* Rate limit cache */

  /**
   * Tells if you hit the Twitter rate limit for {endpoint}.
   * (local data only, this should not ask anything to Twitter)
   */
  public hasHitRateLimit(endpoint: string) {
    if (this.isRateLimitStatusObsolete(endpoint)) {
      return false;
    }
    return this.getLastRateLimitStatus(endpoint)?.remaining === 0;
  }

  /**
   * Tells if you hit the returned Twitter rate limit for {endpoint} has expired.
   * If client has no saved rate limit data for {endpoint}, this will gives you `true`.
   */
  public isRateLimitStatusObsolete(endpoint: string) {
    const rateLimit = this.getLastRateLimitStatus(endpoint);

    if (rateLimit === undefined) {
      return true;
    }
    // Timestamps are exprimed in seconds, JS works with ms
    return (rateLimit.reset * 1000) < Date.now();
  }

  /**
   * Get the last obtained Twitter rate limit information for {endpoint}.
   * (local data only, this should not ask anything to Twitter)
   */
  public getLastRateLimitStatus(endpoint: string): TwitterRateLimit | undefined {
    const endpointWithPrefix = endpoint.match(/^https?:\/\//) ? endpoint : (this._prefix + endpoint);
    return this._rateLimits[endpointWithPrefix];
  }

  /* Current user cache */

  /** Get cached current user. */
  protected async getCurrentUserObject(forceFetch = false) {
    if (!forceFetch && this._currentUser) {
      return this._currentUser;
    }

    const currentUser = await this.get<UserV1>(
      'account/verify_credentials.json',
      { tweet_mode: 'extended' },
      { prefix: 'https://api.twitter.com/1.1/' },
    );
    this._currentUser = currentUser;

    return currentUser;
  }

  /* Direct HTTP methods */

  async get<T = any>(url: string, query?: TRequestQuery, args?: TGetClientRequestArgsDataResponse) : Promise<T>;
  async get<T = any>(url: string, query?: TRequestQuery, args?: TGetClientRequestArgsFullResponse) : Promise<TwitterResponse<T>>;

  public async get<T = any>(
    url: string,
    query: TRequestQuery = {},
    { fullResponse, prefix = this._prefix, ...rest }: TGetClientRequestArgs = {},
  ) : Promise<T | TwitterResponse<T>> {
    if (prefix)
      url = prefix + url;

    const resp = await this.send<T>({
      url,
      method: 'GET',
      query,
      ...rest,
    });

    return fullResponse ? resp : resp.data;
  }

  async delete<T = any>(url: string, query?: TRequestQuery, args?: TGetClientRequestArgsDataResponse) : Promise<T>;
  async delete<T = any>(url: string, query?: TRequestQuery, args?: TGetClientRequestArgsFullResponse) : Promise<TwitterResponse<T>>;

  public async delete<T = any>(
    url: string,
    query: TRequestQuery = {},
    { fullResponse, prefix = this._prefix, ...rest }: TGetClientRequestArgs = {},
  ) : Promise<T | TwitterResponse<T>> {
    if (prefix)
      url = prefix + url;

    const resp = await this.send<T>({
      url,
      method: 'DELETE',
      query,
      ...rest,
    });

    return fullResponse ? resp : resp.data;
  }

  async post<T = any>(url: string, body?: TRequestBody, args?: TClientRequestArgsDataResponse) : Promise<T>;
  async post<T = any>(url: string, body?: TRequestBody, args?: TClientRequestArgsFullResponse) : Promise<TwitterResponse<T>>;

  public async post<T = any>(url: string, body?: TRequestBody, { fullResponse, prefix = this._prefix, ...rest }: TClientRequestArgs = {}) : Promise<T | TwitterResponse<T>> {
    if (prefix)
      url = prefix + url;

    const resp = await this.send<T>({
      url,
      method: 'POST',
      body,
      ...rest,
    });

    return fullResponse ? resp : resp.data;
  }

  async put<T = any>(url: string, body?: TRequestBody, args?: TClientRequestArgsDataResponse) : Promise<T>;
  async put<T = any>(url: string, body?: TRequestBody, args?: TClientRequestArgsFullResponse) : Promise<TwitterResponse<T>>;

  public async put<T = any>(url: string, body: TRequestBody, { fullResponse, prefix = this._prefix, ...rest }: TClientRequestArgs = {}) : Promise<T | TwitterResponse<T>> {
    if (prefix)
      url = prefix + url;

    const resp = await this.send<T>({
      url,
      method: 'PUT',
      body,
      ...rest,
    });

    return fullResponse ? resp : resp.data;
  }

  async patch<T = any>(url: string, body?: TRequestBody, args?: TClientRequestArgsDataResponse) : Promise<T>;
  async patch<T = any>(url: string, body?: TRequestBody, args?: TClientRequestArgsFullResponse) : Promise<TwitterResponse<T>>;

  public async patch<T = any>(url: string, body?: TRequestBody, { fullResponse, prefix = this._prefix, ...rest }: TClientRequestArgs = {}) : Promise<T | TwitterResponse<T>> {
    if (prefix)
      url = prefix + url;

    const resp = await this.send<T>({
      url,
      method: 'PATCH',
      body,
      ...rest,
    });

    return fullResponse ? resp : resp.data;
  }


  /** Stream request helpers */

  getStream<T = any>(url: string, query: TRequestQuery | undefined, options: TStreamClientRequestArgsWithoutAutoConnect) : TweetStream<T>;
  getStream<T = any>(url: string, query?: TRequestQuery, options?: TStreamClientRequestArgsWithAutoConnect) : Promise<TweetStream<T>>;
  getStream<T = any>(url: string, query?: TRequestQuery, options?: TStreamClientRequestArgs) : Promise<TweetStream<T>> | TweetStream<T>;

  public getStream<T = any>(url: string, query?: TRequestQuery, { prefix = this._prefix, ...rest }: TStreamClientRequestArgs = {}) : Promise<TweetStream<T>> | TweetStream<T> {
    return this.sendStream<T>({
      url: prefix ? prefix + url : url,
      method: 'GET',
      query,
      ...rest,
    });
  }

  postStream<T = any>(url: string, body: TRequestBody | undefined, options: TStreamClientRequestArgsWithoutAutoConnect) : TweetStream<T>;
  postStream<T = any>(url: string, body?: TRequestBody, options?: TStreamClientRequestArgsWithAutoConnect) : Promise<TweetStream<T>>;
  postStream<T = any>(url: string, body?: TRequestBody, options?: TStreamClientRequestArgs) : Promise<TweetStream<T>> | TweetStream<T>;

  public postStream<T = any>(url: string, body?: TRequestBody, { prefix = this._prefix, ...rest }: TStreamClientRequestArgs = {}) : Promise<TweetStream<T>> | TweetStream<T> {
    return this.sendStream<T>({
      url: prefix ? prefix + url : url,
      method: 'POST',
      body,
      ...rest,
    });
  }
}
