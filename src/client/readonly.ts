import TwitterApi from '.';
import TwitterApiBase from '../client.base';
import {
  AccessOAuth2TokenArgs,
  AccessOAuth2TokenResult,
  AccessTokenResult,
  BearerTokenResult, BuildOAuth2RequestLinkArgs, LoginResult,
  RequestTokenArgs,
  RequestTokenResult,
  TOAuth2Scope,
  Tweetv2SearchParams,
} from '../types';
import TwitterApiv1ReadOnly from '../v1/client.v1.read';
import TwitterApiv2ReadOnly from '../v2/client.v2.read';
import { OAuth2Helper } from '../client-mixins/oauth2.helper';

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

  /**
   * Fetch and cache current user.
   * This method can only be called with a OAuth 1.0a user authentification.
   *
   * You can use this method to test if authentification was successful.
   * Next calls to this methods will use the cached user, unless `forceFetch: true` is given.
   */
  public async currentUser(forceFetch = false) {
    return await this.getCurrentUserObject(forceFetch);
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
  public async generateAuthLink(
    oauth_callback = 'oob',
    {
      authAccessType,
      linkMode = 'authenticate',
      forceLogin,
      screenName,
    }: Partial<RequestTokenArgs> = {}
  ) {
    const oauthResult = await this.post<RequestTokenResult>(
      'https://api.twitter.com/oauth/request_token',
      { oauth_callback, x_auth_access_type: authAccessType }
    );
    let url = `https://api.twitter.com/oauth/${linkMode}?oauth_token=${encodeURIComponent(oauthResult.oauth_token)}`;

    if (forceLogin !== undefined) {
      url += `&force_login=${encodeURIComponent(forceLogin)}`;
    }
    if (screenName !== undefined) {
      url += `&screen_name=${encodeURIComponent(screenName)}`;
    }

    return {
      url,
      ...oauthResult,
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
   * const { client: userClient } = await requestClient.login('oauth_verifier');
   *
   * // {userClient} is a valid {TwitterApi} object you can use for future requests
   * ```
   */
  public async login(oauth_verifier: string): Promise<LoginResult> {
    const oauth_result = await this.post<AccessTokenResult>(
      'https://api.twitter.com/oauth/access_token',
      { oauth_token: this._accessToken, oauth_verifier }
    );

    const client = new TwitterApi({
      appKey: this._consumerToken!,
      appSecret: this._consumerSecret!,
      accessToken: oauth_result.oauth_token,
      accessSecret: oauth_result.oauth_token_secret,
    });

    return {
      accessToken: oauth_result.oauth_token,
      accessSecret: oauth_result.oauth_token_secret,
      userId: oauth_result.user_id,
      screenName: oauth_result.screen_name,
      client,
    };
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

    // Create a client with Basic authentification
    const basicClient = new TwitterApi({ username: this._consumerToken, password: this._consumerSecret });
    const res = await basicClient.post<BearerTokenResult>('https://api.twitter.com/oauth2/token', { grant_type: 'client_credentials' });

    // New object with Bearer token
    return new TwitterApi(res.access_token);
  }

  /* OAuth 2 user authentification */

  /**
   * Generate the OAuth request token link for user-based OAuth 2.0 auth.
   *
   * ```ts
   * // Instanciate TwitterApi with client ID
   * const client = new TwitterApi({ clientId: 'yourClientId' });
   *
   * // Generate a link to callback URL that will gives a token with tweet+user read access
   * const link = client.generateOAuth2AuthLink('your-callback-url', { scope: ['tweet.read', 'users.read'] });
   *
   * // Extract props from generate link
   * const { url, state, codeVerifier } = link;
   *
   * // redirect end-user to url
   * // Save `state` and `codeVerifier` somewhere, it will be needed for next auth step.
   * ```
   */
  generateOAuth2AuthLink(redirectUri: string, options: Partial<BuildOAuth2RequestLinkArgs> = {}) {
    if (!this._clientId) {
      throw new Error(
        'Twitter API instance is not initialized with client ID. ' +
        'Please build an instance with: new TwitterApi({ clientId: \'<yourClientId>\' })',
      );
    }

    const state = options.state ?? OAuth2Helper.generateRandomString(32);
    const codeVerifier = OAuth2Helper.getCodeVerifier();
    const codeChallenge = OAuth2Helper.getCodeChallengeFromVerifier(codeVerifier);
    const rawScope = options.scope ?? '';
    const scope = Array.isArray(rawScope) ? rawScope.join(' ') : rawScope;

    const url = new URL('https://twitter.com/i/oauth2/authorize');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', this._clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('state', state);
    url.searchParams.set('code_challenge', codeChallenge);
    url.searchParams.set('code_challenge_method', 's256');
    url.searchParams.set('scope', scope);

    return {
      url: url.toString(),
      state,
      codeVerifier,
      codeChallenge,
    };
  }

  /**
   * Obtain access to user-based OAuth 2.0 auth.
   *
   * After user is redirect from your callback, use obtained code to
   * instanciate the new TwitterApi instance.
   *
   * ```ts
   * // Use the saved codeVerifier associated to state (present in query string of callback)
   * const requestClient = new TwitterApi({ clientId: 'yourClientId' });
   *
   * const { client: userClient, refreshToken } = await requestClient.loginWithOAuth2({
   *  code: 'codeFromQueryString',
   *  // the same URL given to generateOAuth2AuthLink
   *  redirectUri,
   *  // the verifier returned by generateOAuth2AuthLink
   *  codeVerifier,
   * });
   *
   * // {userClient} is a valid {TwitterApi} object you can use for future requests
   * // {refreshToken} is defined if 'offline.access' is in scope.
   * ```
   */
  async loginWithOAuth2({ code, codeVerifier, redirectUri }: AccessOAuth2TokenArgs) {
    if (!this._clientId) {
      throw new Error(
        'Twitter API instance is not initialized with client ID. ' +
        'Please build an instance with: new TwitterApi({ clientId: \'<yourClientId>\' })',
      );
    }

    const accessTokenResult = await this.post<AccessOAuth2TokenResult>('https://api.twitter.com/2/oauth2/token', {
      code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      client_id: this._clientId,
    });

    return this.parseOAuth2AccessTokenResult(accessTokenResult);
  }

  /**
   * Obtain a new access token to user-based OAuth 2.0 auth from a refresh token.
   *
   * ```ts
   * const requestClient = new TwitterApi({ clientId: 'yourClientId' });
   *
   * const { client: userClient } = await requestClient.refreshOAuth2Token('refreshToken');
   * // {userClient} is a valid {TwitterApi} object you can use for future requests
   * ```
   */
  async refreshOAuth2Token(refreshToken: string) {
    if (!this._clientId) {
      throw new Error(
        'Twitter API instance is not initialized with client ID. ' +
        'Please build an instance with: new TwitterApi({ clientId: \'<yourClientId>\' })',
      );
    }

    const accessTokenResult = await this.post<AccessOAuth2TokenResult>('https://api.twitter.com/2/oauth2/token', {
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      client_id: this._clientId,
    });

    return this.parseOAuth2AccessTokenResult(accessTokenResult);
  }

  /**
   * Revoke a single user-based OAuth 2.0 token.
   *
   * You must specify its source, access token (directly after login)
   * or refresh token (if you've called `.refreshOAuth2Token` before).
   */
  async revokeOAuth2Token(token: string, tokenType: 'access_token' | 'refresh_token' = 'access_token') {
    if (!this._clientId) {
      throw new Error(
        'Twitter API instance is not initialized with client ID. ' +
        'Please build an instance with: new TwitterApi({ clientId: \'<yourClientId>\' })',
      );
    }

    return await this.post<void>('https://api.twitter.com/2/oauth2/revoke', {
      client_id: this._clientId,
      token,
      token_type_hint: tokenType,
    });
  }

  protected parseOAuth2AccessTokenResult(result: AccessOAuth2TokenResult) {
    const client = new TwitterApi(result.access_token);
    const scope = result.scope.split(' ').filter(e => e) as TOAuth2Scope[];

    return {
      client,
      expiresIn: result.expires_in,
      accessToken: result.access_token,
      scope,
      refreshToken: result.refresh_token,
    };
  }
}
