import 'mocha';
import { expect } from 'chai';
import { getUserKeys, getRequestKeys } from '../src/test/utils';
import type {
  ITwitterApiClientPlugin,
  TwitterResponse,
  ITwitterApiBeforeRequestConfigHookArgs,
  ITwitterApiAfterRequestHookArgs,
  ITwitterApiAfterOAuth1RequestTokenHookArgs,
} from '../src';
import TwitterApiRateLimiterPlugin from '../src/plugins/rate.limiter.plugin';
import { TwitterApi } from '../src';
import { RateLimiter } from 'limiter';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const nock = require('nock');
class SimpleCacheTestPlugin implements ITwitterApiClientPlugin {
  protected cache: { [urlHash: string]: TwitterResponse<any> } = {};

  onBeforeRequestConfig(args: ITwitterApiBeforeRequestConfigHookArgs) {
    const hash = this.getHashFromRequest(args);
    return this.cache[hash];
  }

  onAfterRequest(args: ITwitterApiAfterRequestHookArgs) {
    const hash = this.getHashFromRequest(args);
    this.cache[hash] = args.response;
  }

  protected getHashFromRequest({ url, params }: ITwitterApiBeforeRequestConfigHookArgs) {
    const strQuery = JSON.stringify(params.query ?? {});
    const strParams = JSON.stringify(params.params ?? {});

    return params.method.toUpperCase() + ' ' + url.toString() + '|' + strQuery + '|' + strParams;
  }
}

class SimpleOAuthStepHelperPlugin implements ITwitterApiClientPlugin {
  protected cache: { [oauthToken: string]: string } = {};

  onOAuth1RequestToken(args: ITwitterApiAfterOAuth1RequestTokenHookArgs) {
    this.cache[args.oauthResult.oauth_token] = args.oauthResult.oauth_token_secret;
  }

  login(oauthToken: string, oauthVerifier: string) {
    if (!oauthVerifier || !this.isOAuthTokenValid(oauthToken)) {
      throw new Error('Invalid or expired token.');
    }

    const client = new TwitterApi({
      ...getRequestKeys(),
      accessToken: oauthToken,
      accessSecret: this.cache[oauthToken],
    });

    return client.login(oauthVerifier);
  }

  isOAuthTokenValid(oauthToken: string) {
    return !!this.cache[oauthToken];
  }
}

describe('Plugin API', () => {
  it('Cache a single request with a plugin', async () => {
    const client = new TwitterApi(getUserKeys(), { plugins: [new SimpleCacheTestPlugin()] });

    const user = await client.v1.verifyCredentials();
    const anotherRequest = await client.v1.verifyCredentials();

    expect(user).to.equal(anotherRequest);
  }).timeout(1000 * 30);

  it('Remember OAuth token secret between step 1 and 2 of authentication', async () => {
    const client = new TwitterApi(getRequestKeys(), { plugins: [new SimpleOAuthStepHelperPlugin()] });

    const { oauth_token } = await client.generateAuthLink('oob');

    // Is oauth token registred in cache?
    const loginPlugin = client.getPluginOfType(SimpleOAuthStepHelperPlugin)!;
    expect(loginPlugin.isOAuthTokenValid(oauth_token)).to.equal(true);

    // Must login through
    // const { client: loggedClient, accessToken, accessSecret } = await loginPlugin.login(oauth_token, 'xxxxxxxx');
    // - Save accessToken, accessSecret to persistent storage
  }).timeout(1000 * 30);

  describe('RequestLimiter plugin', () => {

    it('Should assign 15 requests per 15 minutes by default', async () => {
      const limiterPlugin = new TwitterApiRateLimiterPlugin();
      const client = new TwitterApi(getRequestKeys(), { plugins: [limiterPlugin] });

      await client.generateAuthLink('oob');
      const limiters = limiterPlugin.getActiveLimiters();

      expect(Object.keys(limiters).length).to.equal(1);
      expect(limiters['15r/15m']).to.be.instanceOf(RateLimiter);
      const {tokensThisInterval, tokenBucket: {interval, tokensPerInterval}} = limiters['15r/15m'] as RateLimiter;
      expect(interval).to.equal(15*60*1000);
      expect(tokensPerInterval).to.equal(15);
      expect(tokensThisInterval).to.equal(1);
    });

    it('Should rate limit /application/rate_limit_status to 180 requests per 15 minutes', async () => {
      nock('https://api.twitter.com').get(() => true).reply(200);
      const limiterPlugin = new TwitterApiRateLimiterPlugin();
      const client = new TwitterApi(getRequestKeys(), { plugins: [limiterPlugin] }).v1;

      await client.rateLimitStatuses();
      const limiters = limiterPlugin.getActiveLimiters();

      expect(Object.keys(limiters).length).to.equal(1);
      expect(limiters['180r/15m']).to.be.instanceOf(RateLimiter);
      const {tokenBucket: {interval, tokensPerInterval}} = limiters['180r/15m'] as RateLimiter;
      expect(interval).to.equal(15*60*1000);
      expect(tokensPerInterval).to.equal(180);
    });

    it('Should rate limit /users/me to 75 requests per 15 minutes', async () => {
      nock('https://api.twitter.com').get(() => true).reply(200);
      const limiterPlugin = new TwitterApiRateLimiterPlugin();
      const client = new TwitterApi(getRequestKeys(), { plugins: [limiterPlugin] }).v2;

      await client.me();
      const limiters = limiterPlugin.getActiveLimiters();

      expect(Object.keys(limiters).length).to.equal(1);
      expect(limiters['75r/15m']).to.be.instanceOf(RateLimiter);
      const {tokenBucket: {interval, tokensPerInterval}} = limiters['75r/15m'] as RateLimiter;
      expect(interval).to.equal(15*60*1000);
      expect(tokensPerInterval).to.equal(75);
    });
  });
});
