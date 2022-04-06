import { TwitterApi } from '../index';
import type { ITwitterApiClientPlugin, ITwitterApiResponseErrorHookArgs, ITwitterApiBeforeRequestConfigHookArgs, TwitterApiOAuth2Init, IParsedOAuth2TokenResult } from '../index';
import { TwitterApiPluginResponseOverride } from '../types';

const triedSymbol = Symbol();

declare module '../types' {
  interface IGetHttpRequestArgs {
    [triedSymbol]?: boolean;
  }
}

export interface IAutoTokenRefresherArgs {
  refreshToken: string;
  credentials: TwitterApiOAuth2Init;
  onTokenUpdate?: (newToken: IParsedOAuth2TokenResult) => void | Promise<void>;
}

export class TwitterApiAutoTokenRefresher implements ITwitterApiClientPlugin {
  protected credentials: TwitterApiOAuth2Init;
  protected currentRefreshToken: string;
  protected tokenExpired = false;
  protected nextTokenExpireTimeout: NodeJS.Timeout | null = null;
  protected currentRefreshPromise: Promise<IParsedOAuth2TokenResult> | null = null;

  public constructor(protected options: IAutoTokenRefresherArgs) {
    this.credentials = { ...options.credentials };
    this.currentRefreshToken = options.refreshToken;
  }

  public async onBeforeRequestConfig(args: ITwitterApiBeforeRequestConfigHookArgs) {
    if (this.currentRefreshPromise) {
      await this.currentRefreshPromise;
    } else if (this.tokenExpired) {
      // If we know that token is expired, don't let request fail,
      // just that right now the token update!
      const token = await this.getRefreshTokenPromise();
      // Set access token manually in client [THIS MUTATE THE INSTANCE]
      args.client.bearerToken = token.accessToken;
    }
  }

  public async onResponseError(args: ITwitterApiResponseErrorHookArgs) {
    const error = args.error;

    // If error is unauthorized and recursive symbol does not exists
    if (error.code === 401 && !args.params[triedSymbol]) {
      // [THIS MEANS ORIGINAL ERROR WILL BE SKIPPED IF REFRESH TOKEN FAILS]
      // Share every possibile concurrent refresh token call
      const token = await this.getRefreshTokenPromise();
      // Set access token manually in client [THIS MUTATE THE INSTANCE]
      args.client.bearerToken = token.accessToken;

      // Prevent recursivity
      args.params[triedSymbol] = true;
      // Will throw if request fails
      const response = await args.client.send(args.params);

      return new TwitterApiPluginResponseOverride(response);
    }

    // Unsupported error or recursive call: do nothing, error will be thrown normally
  }

  protected getRefreshTokenPromise() {
    if (this.currentRefreshPromise) {
      return this.currentRefreshPromise;
    } else {
      return this.currentRefreshPromise = this.refreshToken();
    }
  }

  protected async refreshToken() {
    const client = new TwitterApi(this.credentials);
    const token = await client.refreshOAuth2Token(this.currentRefreshToken);

    this.setExpireTimeout(token.expiresIn);

    // refreshToken is necesserly defined, as we just have refreshed a token
    this.currentRefreshToken = token.refreshToken!;
    this.tokenExpired = false;
    await this.options.onTokenUpdate?.(token);

    return token;
  }

  protected setExpireTimeout(expiresIn: number) {
    if (this.nextTokenExpireTimeout) {
      clearTimeout(this.nextTokenExpireTimeout);
      this.nextTokenExpireTimeout = null;
    }

    // Unset promise within 20 seconds of safety
    // No promise will cause requests to ask a new token if needed
    this.nextTokenExpireTimeout = setTimeout(() => {
      this.currentRefreshPromise = null;
      this.tokenExpired = true;
    }, (expiresIn - 20) * 1000);
    this.nextTokenExpireTimeout.unref();
  }
}

export default TwitterApiAutoTokenRefresher;

// Usage

const credentials = { clientId: '', clientSecret: '' };
const tokenStore = { accessToken: '', refreshToken: '' };

const autoRefresherPlugin = new TwitterApiAutoTokenRefresher({
  refreshToken: tokenStore.refreshToken,
  credentials,
  onTokenUpdate: token => {
    tokenStore.accessToken = token.accessToken;
    tokenStore.refreshToken = token.refreshToken!;
  },
});
const client = new TwitterApi(tokenStore.accessToken, { plugins: [autoRefresherPlugin] });
