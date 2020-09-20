import TwitterApi from '.';
import TwitterApiBase from '../client.base';
import { AccessTokenResult, BearerTokenResult, RequestTokenResult } from '../types';
import TwitterApiv1ReadOnly from '../v1/client.v1.read';
import TwitterApiv2ReadOnly from '../v2/client.v2.read';
import { Tweetv2SearchParams } from '../v2/types.v2';

/**
 * Twitter v1.1 and v2 API client.
 */
export default class TwitterApiReadOnly extends TwitterApiBase {
  protected _v1?: TwitterApiv1ReadOnly;
  protected _v2?: TwitterApiv2ReadOnly;

  /* Direct access to subclients */
  public get v1() {
    if (this._v1) return this._v1;
    
    return this._v1 = new TwitterApiv1ReadOnly(this);
  }

  public get v2() {
    if (this._v2) return this._v2;
    
    return this._v2 = new TwitterApiv2ReadOnly(this);
  }


  /* Shortcuts to endpoints */

  public search(what: string, options?: Partial<Tweetv2SearchParams>) {
    return this.v2.search(what, options);
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
}
