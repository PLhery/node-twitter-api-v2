import { request, RequestOptions } from 'https';
import { URLSearchParams } from 'url';
import crypto from 'crypto';
import OAuth from 'oauth-1.0a';
import FormData from 'form-data';
import { TwitterApiTokens, TwitterRateLimit, TwitterResponse } from './types';

/**
 * Base class for Twitter instances
 */
export default abstract class TwitterApiBase {
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
  protected _prefix: string | undefined;

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

  public constructor(token?: TwitterApiTokens | string | TwitterApiBase) {
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

  async get<T = any>(url: string, full_response?: false, prefix?: string) : Promise<T>;
  async get<T = any>(url: string, full_response: true, prefix?: string) : Promise<TwitterResponse<T>>;

  public async get<T = any>(url: string, full_response = false, prefix = this._prefix) : Promise<T | TwitterResponse<T>> {
    if (prefix)
      url = prefix + url;

    const parameters: Record<string, string> = {};
    const parsed = new URL(url);

    for (const [item, value] of parsed.searchParams) {
      parameters[item] = value;
    }

    const resp = await this.send<T>(parsed.origin + parsed.pathname, 'GET', parameters);
    return full_response ? resp : resp.data;
  }

  async delete<T = any>(url: string, full_response?: false, prefix?: string) : Promise<T>;
  async delete<T = any>(url: string, full_response: true, prefix?: string) : Promise<TwitterResponse<T>>;

  public async delete<T = any>(url: string, full_response = false, prefix = this._prefix) : Promise<T | TwitterResponse<T>> {
    if (prefix)
      url = prefix + url;

    const parameters: Record<string, string> = {};
    const parsed = new URL(url);

    for (const [item, value] of parsed.searchParams) {
      parameters[item] = value;
    }

    const resp = await this.send<T>(parsed.origin + parsed.pathname, 'DELETE', parameters);
    return full_response ? resp : resp.data;
  }

  async post<T = any>(url: string, body?: Record<string, any>, full_response?: false, prefix?: string) : Promise<T>;
  async post<T = any>(url: string, body: Record<string, any> | undefined, full_response: true, prefix?: string) : Promise<TwitterResponse<T>>;

  public async post<T = any>(url: string, body?: Record<string, any>, full_response = false, prefix = this._prefix) : Promise<T | TwitterResponse<T>> {
    if (prefix)
      url = prefix + url;

    const resp = await this.send<T>(url, 'POST', body);
    return full_response ? resp : resp.data;
  }

  async put<T = any>(url: string, body?: Record<string, any>, full_response?: false, prefix?: string) : Promise<T>;
  async put<T = any>(url: string, body: Record<string, any> | undefined, full_response: true, prefix?: string) : Promise<TwitterResponse<T>>;

  public async put<T = any>(url: string, body?: Record<string, any>, full_response = false, prefix = this._prefix) : Promise<T | TwitterResponse<T>> {
    if (prefix)
      url = prefix + url;

    const resp = await this.send<T>(url, 'PUT', body);
    return full_response ? resp : resp.data;
  }

  async patch<T = any>(url: string, body?: Record<string, any>, full_response?: false, prefix?: string) : Promise<T>;
  async patch<T = any>(url: string, body: Record<string, any> | undefined, full_response: true, prefix?: string) : Promise<TwitterResponse<T>>;

  public async patch<T = any>(url: string, body?: Record<string, any>, full_response = false, prefix = this._prefix) : Promise<T | TwitterResponse<T>> {
    if (prefix)
      url = prefix + url;

    const resp = await this.send<T>(url, 'PATCH', body);
    return full_response ? resp : resp.data;
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
    let body: string | Buffer | undefined = undefined;
    method = method.toUpperCase();
    headers = headers ?? {};

    // Delete undefined parameters
    for (const parameter in parameters) {
      if (parameters[parameter] === undefined)
        delete parameters[parameter];
    }

    // OAuth signature should not include parameters when using multipart.
    const isMultipart = TwitterApiBase.BODY_METHODS.has(method) && this.autoDetectBodyType(url) === 'form-data';

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
        data: isMultipart ? {} : parameters,
      }, this.getOAuthAccessTokens());

      headers = { ...headers, ...this._oauth.toHeader(auth) };
    }

    if (TwitterApiBase.BODY_METHODS.has(method)) {
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

    if (url.startsWith('https://upload.twitter.com/1.1/media')) {
      return 'form-data';
    }
    
    const endpoint = url.split('.twitter.com/1.1/', 2)[1];

    if (TwitterApiBase.JSON_1_1_ENDPOINTS.has(endpoint)) {
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
      headers['content-type'] = 'application/json;charset=UTF-8';
      return JSON.stringify(parameters);
    }
    else if (mode === 'url') {
      headers['content-type'] = 'application/x-www-form-urlencoded;charset=UTF-8';

      if (Object.keys(parameters).length) 
        return new URLSearchParams(parameters).toString();

      return '';
    }
    else {
      const form = new FormData();

      for (const parameter in parameters) {
        form.append(parameter, parameters[parameter]);
      }

      const formHeaders = form.getHeaders();
      for (const item in formHeaders) {
        headers[item] = formHeaders[item];
      }

      return form.getBuffer();
    }
  }

  protected httpSend<T = any>(url: string, options: RequestOptions, body?: string | Buffer) : Promise<TwitterResponse<T>> {
    if (body) {
      options.headers = options.headers ?? {};

      if (typeof body === 'string') {
        const encoder = new TextEncoder();
        options.headers['content-length'] = encoder.encode(body).length;
      }
      else {
        options.headers['content-length'] = body.length;
      }
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
          if (code >= 400 || (typeof data === 'object' && 'errors' in data)) {
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
}
