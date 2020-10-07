import TwitterApiSubClient from '../client.subclient';
import { API_V2_PREFIX } from '../globals';
import TweetPaginator from './TweetPaginator';
import { Tweetv2SearchParams, Tweetv2SearchResult } from './types.v2';

/**
 * Base Twitter v2 client with only read right.
 */
export default class TwitterApiv2ReadOnly extends TwitterApiSubClient {
  protected _prefix = API_V2_PREFIX;

  public async search(what: string, options: Partial<Tweetv2SearchParams> = {}) {
    options.query = what;
    options.max_results = options.max_results ?? '10';

    const initialRq = await this.get<Tweetv2SearchResult>('tweets/search/recent', options, true);

    return new TweetPaginator(initialRq.data, initialRq.rateLimit!, this, {
      query: options as Tweetv2SearchParams,
    });
  }
}
