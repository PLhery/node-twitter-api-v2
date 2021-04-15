import { TwitterApiTokens, TwitterResponse } from './types';
import {
  ClientRequestMaker,
  TCustomizableRequestArgs,
  TRequestBody,
  TRequestQuery
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
};

/**
 * Base class for Twitter instances
 */
export default abstract class TwitterApiBase extends ClientRequestMaker {
  protected _prefix: string | undefined;

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
   * Create a clone of {instance}.
   */
  constructor(instance: TwitterApiBase);

  public constructor(token?: TwitterApiTokens | string | TwitterApiBase) {
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
    }
    else if (typeof token === 'object') {
      this._consumerToken = token.appKey;
      this._consumerSecret = token.appSecret;

      if (token.accessToken && token.accessSecret) {
        this._accessToken = token.accessToken;
        this._accessSecret = token.accessSecret;
      }

      this._oauth = this.buildOAuth();
    }
  }

  protected setPrefix(prefix: string | undefined) {
    this._prefix = prefix;
  }

  public getActiveTokens() {
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
  }


  /* Direct HTTP methods */

  async get<T = any>(url: string, query?: TRequestQuery, args?: TClientRequestArgsDataResponse) : Promise<T>;
  async get<T = any>(url: string, query?: TRequestQuery, args?: TClientRequestArgsFullResponse) : Promise<TwitterResponse<T>>;

  public async get<T = any>(url: string, query: TRequestQuery = {}, { fullResponse, prefix = this._prefix }: TGetClientRequestArgs = {}) : Promise<T | TwitterResponse<T>> {
    if (prefix)
      url = prefix + url;

    const resp = await this.send<T>({
      url,
      method: 'GET',
      query,
    });

    return fullResponse ? resp : resp.data;
  }

  async delete<T = any>(url: string, query?: TRequestQuery, args?: TClientRequestArgsDataResponse) : Promise<T>;
  async delete<T = any>(url: string, query?: TRequestQuery, args?: TClientRequestArgsFullResponse) : Promise<TwitterResponse<T>>;

  public async delete<T = any>(url: string, query: TRequestQuery = {}, { fullResponse, prefix = this._prefix }: TGetClientRequestArgs = {}) : Promise<T | TwitterResponse<T>> {
    if (prefix)
      url = prefix + url;

    const resp = await this.send<T>({
      url,
      method: 'DELETE',
      query,
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

  public async getStream(url: string, query?: TRequestQuery, { prefix = this._prefix }: TStreamClientRequestArgs = {}) : Promise<TweetStream> {
    if (prefix)
      url = prefix + url;

    return this.sendStream({
      url,
      method: 'GET',
      query,
    });
  }

  public async deleteStream(url: string, query?: TRequestQuery, { prefix = this._prefix }: TStreamClientRequestArgs = {}) : Promise<TweetStream> {
    if (prefix)
      url = prefix + url;

    return this.sendStream({
      url,
      method: 'DELETE',
      query,
    });
  }

  public async postStream(url: string, body?: TRequestBody, { prefix = this._prefix, ...rest }: TStreamClientRequestArgs = {}) : Promise<TweetStream> {
    if (prefix)
      url = prefix + url;

    return this.sendStream({
      url,
      method: 'POST',
      body,
      ...rest,
    });
  }

  public async putStream(url: string, body?: TRequestBody, { prefix = this._prefix, ...rest }: TStreamClientRequestArgs = {}) : Promise<TweetStream> {
    if (prefix)
      url = prefix + url;

    return this.sendStream({
      url,
      method: 'PUT',
      body,
      ...rest,
    });
  }

  public async patchStream(url: string, body?: TRequestBody, { prefix = this._prefix, ...rest }: TStreamClientRequestArgs = {}) : Promise<TweetStream> {
    if (prefix)
      url = prefix + url;

    return this.sendStream({
      url,
      method: 'PATCH',
      body,
      ...rest,
    });
  }
}
