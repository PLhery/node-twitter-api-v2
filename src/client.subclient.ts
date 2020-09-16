import TwitterApiBase from './client.base';
import { TwitterResponse } from './types';

/**
 * Base subclient for every v1 and v2 client.
 */
export default abstract class TwitterApiSubClient extends TwitterApiBase {
  constructor(instance: TwitterApiBase) {
    super();

    if (!(instance instanceof TwitterApiBase)) {
      throw new Error('You must instance TwitterApiv1 instance from existing TwitterApi instance.');
    }

    // @ts-expect-error  Signature mismatch for get and delete, but it works.
    const inst: TwitterApiSubClient = instance;

    this._bearerToken = inst._bearerToken;
    this._consumerToken = inst._consumerToken;
    this._consumerSecret = inst._consumerSecret;
    this._accessToken = inst._accessToken;
    this._accessSecret = inst._accessSecret;
    this._oauth = inst._oauth;
  }

  public async get<T = any>(url: string, full_response?: boolean) : Promise<T | TwitterResponse<T>>;
  public async get<T = any>(url: string, parameters?: Record<string, string>, full_response?: boolean) : Promise<T | TwitterResponse<T>>;

  public async get<T = any>(url: string, parameters?: Record<string, string> | boolean, full_response = false) : Promise<T | TwitterResponse<T>> {
    if (typeof parameters === 'boolean') {
      full_response = parameters;
      parameters = undefined;
    }
    
    const resp = await this.send<T>(this._prefix + url, 'GET', parameters);
    return full_response ? resp : resp.data;
  }


  public async delete<T = any>(url: string, full_response?: boolean) : Promise<T | TwitterResponse<T>>;
  public async delete<T = any>(url: string, parameters?: Record<string, string>, full_response?: boolean) : Promise<T | TwitterResponse<T>>;

  public async delete<T = any>(url: string, parameters?: Record<string, string> | boolean, full_response = false) : Promise<T | TwitterResponse<T>> {
    if (typeof parameters === 'boolean') {
      full_response = parameters;
      parameters = undefined;
    }

    const resp = await this.send<T>(this._prefix + url, 'DELETE', parameters);
    return full_response ? resp : resp.data;
  }
}
