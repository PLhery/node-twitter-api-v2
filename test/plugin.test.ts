import 'mocha';
import { expect } from 'chai';
import { getUserKeys } from '../src/test/utils';
import type {
  ITwitterApiClientPlugin,
  TwitterResponse,
  ITwitterApiBeforeRequestConfigHookArgs,
  ITwitterApiAfterRequestHookArgs,
} from '../src';
import { RequestAlreadyAvailableInCacheException, TwitterApi } from '../src';

class SimpleCacheTestPlugin implements ITwitterApiClientPlugin {
  protected cache: { [urlHash: string]: TwitterResponse<any> } = {};

  onBeforeRequestConfig(args: ITwitterApiBeforeRequestConfigHookArgs) {
    const hash = this.getHashFromRequest(args);

    if (hash in this.cache) {
      throw new RequestAlreadyAvailableInCacheException('Request already in cache.', this.cache[hash]);
    }
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

describe('Plugin API', () => {
  it('Cache a single request with a plugin', async () => {
    const client = new TwitterApi(getUserKeys(), { plugins: [new SimpleCacheTestPlugin()] });

    const user = await client.v1.verifyCredentials();
    const anotherRequest = await client.v1.verifyCredentials();

    expect(user).to.equal(anotherRequest);
  }).timeout(1000 * 30);
});
