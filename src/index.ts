import { request, RequestOptions } from 'https';
import { IncomingHttpHeaders } from 'http';
import { URLSearchParams } from 'url';
import crypto from 'crypto';
import OAuth from 'oauth-1.0a';

export interface TwitterApiErrorData {
  errors: {
    message: string;
    [name: string]: any;
  }[];
  title?: string;
  detail?: string;
  type?: string;
}

export interface TwitterApiError extends TwitterResponse<TwitterApiErrorData> {
  error: true;
  /** HTTP status code */
  code: number;
}

interface TwitterApiTokens {
  appKey: string;
  appSecret: string;
  accessToken?: string;
  accessSecret?: string;
}

interface TwitterResponse<T> {
  headers: IncomingHttpHeaders;
  data: T;
  rateLimit?: TwitterRateLimit;
}

interface TwitterRateLimit {
  limit: number;
  reset: number;
  remaining: number;
}

interface RequestTokenResult {
  oauth_token: string;
  oauth_token_secret: string;
  oauth_callback_confirmed: 'true';
}

interface AccessTokenResult {
  oauth_token: string;
  oauth_token_secret: string;
  user_id: string;
  screen_name: string;
}

interface BearerTokenResult {
  token_type: 'bearer';
  access_token: string;
}

export default class TwitterApi {
  protected static readonly BODY_METHODS = new Set(['POST', 'PUT', 'PATCH']);
  protected static readonly JSON_1_1_ENDPOINTS = new Set([
    'direct_messages/events/new',
    'direct_messages/welcome_messages/new',
    'direct_messages/welcome_messages/rules/new',
    'media/metadata/create',
    'collections/entries/curate',
  ]);

  protected _bearerToken?: string;
  protected _consumerToken?: string;
  protected _consumerSecret?: string;
  protected _accessToken?: string;
  protected _accessSecret?: string;
  protected _basicToken?: string;
  protected _oauth?: OAuth;

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

  public constructor(token?: TwitterApiTokens | string) {
    if (typeof token === 'string') {
      this._bearerToken = token;
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


  /* Authentification */
  /**
   * Generate the OAuth request token link for user-based OAuth 1.0 auth.
   * 
   * ```ts
   * // Instanciate TwitterApi with consumer keys
   * const client = new TwitterApi({ appKey: 'consumer_key', appSecret: 'consumer_secret' });
   * 
   * const tokenRequest = await client.generateAuthLink('oob-or-your-callback-url');
   * // redirect end-user to tokenRequest.url
   * 
   * // Save tokenRequest.oauth_token_secret somewhere, it will be needed for next auth step.
   * ```
   */
  public async generateAuthLink(oauth_callback = 'oob', x_auth_access_type?: 'read' | 'write') {
    const oauth_result = await this.post<RequestTokenResult>(
      'https://api.twitter.com/oauth/request_token',
      { oauth_callback, x_auth_access_type }
    );

    return {
      url: 'https://api.twitter.com/oauth/authorize?oauth_token=' + encodeURIComponent(oauth_result.oauth_token),
      ...oauth_result,
    };
  }

  /**
   * Obtain access to user-based OAuth 1.0 auth.
   * 
   * After user is redirect from your callback, use obtained oauth_token and oauth_verifier to
   * instanciate the new TwitterApi instance.
   * 
   * ```ts
   * // Use the saved oauth_token_secret associated to oauth_token returned by callback
   * const requestClient = new TwitterApi({ 
   *  appKey: 'consumer_key', 
   *  appSecret: 'consumer_secret', 
   *  accessToken: 'oauth_token', 
   *  accessSecret: 'oauth_token_secret' 
   * });
   * 
   * // Use oauth_verifier obtained from callback request
   * const userClient = await requestClient.login('oauth_verifier');
   * 
   * // {userClient} is a valid {TwitterApi} object you can use for future requests
   * ```
   */
  public async login(oauth_verifier: string) {
    const oauth_result = await this.post<AccessTokenResult>(
      'https://api.twitter.com/oauth/access_token',
      { oauth_token: this._accessToken, oauth_verifier }
    );

    return new TwitterApi({
      appKey: this._consumerToken!,
      appSecret: this._consumerSecret!,
      accessToken: oauth_result.oauth_token,
      accessSecret: oauth_result.oauth_token_secret,
    });
  }

  /**
   * Enable application-only authentification.
   * 
   * To make the request, instanciate TwitterApi with consumer and secret.
   * 
   * ```ts
   * const requestClient = new TwitterApi({ appKey: 'consumer', appSecret: 'secret' });
   * const appClient = await requestClient.appLogin();
   * 
   * // Use {appClient} to make requests
   * ```
   */
  public async appLogin() {
    if (!this._consumerToken || !this._consumerSecret)
      throw new Error('You must setup TwitterApi instance with consumers to enable app-only login');

    const key = encodeURIComponent(this._consumerToken) + ':' + encodeURIComponent(this._consumerSecret);
    const base64 = Buffer.from(key).toString('base64');

    this._basicToken = base64;

    try {
      const res = await this.post<BearerTokenResult>('https://api.twitter.com/oauth2/token', { grant_type: 'client_credentials' });

      // New object with Bearer token
      return new TwitterApi(res.access_token);
    } finally {
      this._basicToken = undefined;
    } 
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

  public async get<T = any>(url: string) : Promise<T> {
    const parameters: Record<string, string> = {};
    const parsed = new URL(url);

    for (const [item, value] of parsed.searchParams) {
      parameters[item] = value;
    }

    return (await this.send<T>(parsed.origin + parsed.pathname, 'GET', parameters)).data;
  }

  public async delete<T = any>(url: string) : Promise<T> {
    const parameters: Record<string, string> = {};
    const parsed = new URL(url);

    for (const [item, value] of parsed.searchParams) {
      parameters[item] = value;
    }

    return (await this.send<T>(parsed.origin + parsed.pathname, 'DELETE', parameters)).data;
  }

  public async post<T = any>(url: string, body?: Record<string, any>) : Promise<T> {
    return (await this.send<T>(url, 'POST', body)).data;
  }

  public async put<T = any>(url: string, body?: Record<string, any>) : Promise<T> {
    return (await this.send<T>(url, 'PUT', body)).data;
  }

  public async patch<T = any>(url: string, body?: Record<string, any>) : Promise<T> {
    return (await this.send<T>(url, 'PATCH', body)).data;
  }


  /* Token helpers */

  protected buildOAuth() {
    if (!this._consumerSecret || !this._consumerToken)
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

  protected send<T = any>(
    url: string, 
    method: string, 
    // must be changed for chunked media upload if sent as binary
    parameters: Record<string, any> = {},
    headers?: Record<string, string>, 
  ) : Promise<TwitterResponse<T>> {
    let body: string | undefined = undefined;
    method = method.toUpperCase();
    headers = headers ?? {};

    if (this._bearerToken) {
      headers.Authorization = 'Bearer ' + this._bearerToken;
    }
    else if (this._basicToken) {
      // Basic auth, to request a bearer token
      headers.Authorization = 'Basic ' + this._basicToken;
    }
    else if (this._consumerSecret && this._oauth) {
      const auth = this._oauth.authorize({
        url, 
        method,
        data: parameters,
      }, this.getOAuthAccessTokens());

      headers = { ...headers, ...this._oauth.toHeader(auth) };
    }

    if (TwitterApi.BODY_METHODS.has(method)) {
      body = this.constructBodyParams(parameters, headers, this.autoDetectBodyType(url)) || undefined;
    }
    else {
      url += this.constructGetParams(parameters);
    }

    return this.httpSend<T>(url, {
      method,
      headers,
    }, body);
  }

  protected autoDetectBodyType(url: string) : 'json' | 'url' | 'form-data' {
    if (url.includes('.twitter.com/2')) {
      // Twitter API v2 always has JSON-encoded requests, right?
      return 'json';
    } 
    
    const endpoint = url.split('.twitter.com/1.1/', 2)[1];

    // TODO detect multipart endpoints

    if (TwitterApi.JSON_1_1_ENDPOINTS.has(endpoint)) {
      return 'json';
    }
    return 'url';
  }

  protected constructGetParams(parameters: Record<string, string>) {
    if (Object.keys(parameters).length) 
      return '?' + new URLSearchParams(parameters).toString();

    return '';
  }

  protected constructBodyParams(
    parameters: Record<string, any>, 
    headers: Record<string, string>, 
    mode: 'json' | 'url' | 'form-data'
  ) {
    if (mode === 'json') {
      headers['content-type'] = 'application/json';
      return JSON.stringify(parameters);
    }
    else if (mode === 'url') {
      headers['content-type'] = 'application/x-www-form-urlencoded;charset=UTF-8';

      if (Object.keys(parameters).length) 
        return new URLSearchParams(parameters).toString();

      return '';
    }
    else {
      // TODO support multipart
      headers['content-type'] = 'multipart/form-data';
      throw new Error('Not yet implemeted');
    }
  }

  protected httpSend<T = any>(url: string, options: RequestOptions, body?: string) : Promise<TwitterResponse<T>> {
    if (body) {
      options.headers = options.headers ?? {};

      const encoder = new TextEncoder();
      options.headers['content-length'] = encoder.encode(body).length;
    } 

    const req = request(url, options);

    let response = '';

    return new Promise((resolve, reject) => {
      // TODO better error handling
      req.on('error', reject);

      req.on('response', res => {
        let rateLimit: TwitterRateLimit | undefined = undefined;

        if (res.headers['x-rate-limit-limit']) {
          rateLimit = {
            limit: Number(res.headers['x-rate-limit-limit']),
            remaining: Number(res.headers['x-rate-limit-remaining']),
            reset: Number(res.headers['x-rate-limit-reset']),
          };
        }

        res.on('data', chunk => response += chunk);
        res.on('end', () => {
          let data: any = response;

          if (response.length && res.headers['content-type']?.includes('application/json')) {
            data = JSON.parse(data);
          }
          // f-e oauth token endpoints
          else if (url.startsWith('https://api.twitter.com/oauth/')) {
            const response_form_entries: any = {};

            for (const [item, value] of new URLSearchParams(data)) {
              response_form_entries[item] = value;
            }

            data = response_form_entries;
          }
          
          // Handle bad error codes
          const code = res.statusCode!;
          if (code >= 400) {
            reject({ 
              data, 
              headers: res.headers, 
              rateLimit,
              code,
              error: true,
            });
          }

          resolve({
            data,
            headers: res.headers,
            rateLimit
          });
        });
      });

      if (body) {
        req.write(body);
      }

      req.end();
    });
  }

  /* Static helpers */
  public static getErrors(error: any) {
    if (typeof error !== 'object')
      return [];

    if (!('data' in error))
      return [];

    return (error as TwitterApiError).data.errors ?? [];
  }
}
