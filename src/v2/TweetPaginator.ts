import { TwitterRateLimit } from '../types';
import TwitterApiv2ReadOnly from './client.v2.read';
import { Tweetv2SearchParams, Tweetv2SearchResult } from './types.v2';

export interface PaginatorParams {
  query: Partial<Tweetv2SearchParams>;
}

/**
 * Represents a Twitter search with v2 API.
 * 
 * ```ts
 * let resultNodeJs = await client.v2.search('nodeJS');
 * 
 * // Get the current page syncronously
 * const tweets = resultNodeJs.tweets;
 * 
 * // Access the next page
 * resultNodeJs = await resultNodeJs.next();
 * 
 * // Fetch until a number of desired results (f-e: fetch at least 1000 results)
 * resultNodeJs = await resultNodeJs.fetchLast(1000); 
 * 
 * // Iterate over results until you hit rate limit or there is no more results
 * const resultTypeScript = await client.v2.search('TypeScript');
 * for await (const tweet of resultTypeScript) {
 *  // {tweet} is a Tweetv2!
 * }
 * 
 * // Iterate over the already fetched tweets
 * for (const tweet of resultTypeScript) {
 *  // {tweet} is a Tweetv2!
 * }
 * ```
 */
export default class TweetPaginator {
  constructor(
    protected _realData: Tweetv2SearchResult, 
    protected _rateLimit: TwitterRateLimit, 
    protected _instance: TwitterApiv2ReadOnly, 
    protected _options: PaginatorParams
  ) { }

  /**
   * Next page.
   */
  async next(maxResults?: number) {
    const untilId = this._realData.meta.oldest_id;
    const query = { ...this._options.query };
    query.until_id = untilId;

    if (maxResults) {
      query.max_results = String(maxResults);
    }

    const result = await this._instance.get<Tweetv2SearchResult>('tweets/search/recent', query, true);
    return new TweetPaginator(result.data, result.rateLimit!, this._instance, { query });
  }

  /**
   * Next page, but store it in current instance.
   */
  async fetchNext(maxResults?: number) {
    const untilId = this._realData.meta.oldest_id;
    const query = { ...this._options.query };
    query.until_id = untilId;

    if (maxResults) {
      query.max_results = String(maxResults);
    }

    const response = await this._instance.get<Tweetv2SearchResult>('tweets/search/recent', query, true);
    const result = response.data;
    this._rateLimit = response.rateLimit!;
    this._realData.meta.oldest_id = result.meta.oldest_id;
    this._realData.meta.result_count += result.meta.result_count;
    this._realData.meta.next_token = result.meta.next_token;
    this._realData.data.push(...result.data);


    return this;
  }

  /** 
   * Fetch up to {count} tweets after current page, 
   * as long as rate limit is not hit and Twitter has some results 
   */
  async fetchLast(count: number) {
    const untilId = this._realData.meta.oldest_id;
    const query = { ...this._options.query };
    query.until_id = untilId;
    query.max_results = '100';

    let resultCount = 0;

    // Break at rate limit limit
    while (resultCount < count && this._isRateLimitOk) {
      const response = await this._instance.get<Tweetv2SearchResult>('tweets/search/recent', query, true);
      const result = response.data;

      this._rateLimit = response.rateLimit!;
      this._realData.meta.oldest_id = result.meta.oldest_id;
      this._realData.meta.result_count += result.meta.result_count;
      this._realData.meta.next_token = result.meta.next_token;
      this._realData.data.push(...result.data);
      resultCount += result.data.length;

      if (!result.data.length || !result.meta.next_token)
        break;
    }

    return this;
  }

  /**
   * Previous page (new tweets)
   */
  async previous() {
    const sinceId = this._realData.meta.newest_id;
    const query = { ...this._options.query };
    query.since_id = sinceId;

    const result = await this._instance.get<Tweetv2SearchResult>('tweets/search/recent', query, true);
    return new TweetPaginator(result.data, result.rateLimit!, this._instance, { query });
  }

  /**
   * Previous page, but in current instance.
   */
  async fetchPrevious() {
    const sinceId = this._realData.meta.newest_id;
    const query = { ...this._options.query };
    query.since_id = sinceId;

    const response = await this._instance.get<Tweetv2SearchResult>('tweets/search/recent', query, true);
    const result = response.data;
    this._rateLimit = response.rateLimit!;
    this._realData.meta.newest_id = result.meta.newest_id;
    this._realData.meta.result_count += result.meta.result_count;
    this._realData.data.unshift(...result.data);

    return this;
  }

  /**
   * Tweets returned by paginator.
   */
  get tweets() {
    return this._realData.data;
  }

  get rateLimit() {
    return { ...this._rateLimit };
  }

  /**
   * Iterate over currently fetched tweets.
   */
  *[Symbol.iterator]() {
    yield* this._realData.data;
  }

  /**
   * Iterate over tweets "undefinitely" (until rate limit is hit / they're no more tweets available)
   */
  async *[Symbol.asyncIterator]() {
    yield* this._realData.data;
    let paginator: TweetPaginator = this;

    while (this._isRateLimitOk) {
      const next = await paginator.next(100);
      this._rateLimit = next._rateLimit;
      yield* next.tweets;

      if (!next.tweets.length) {
        break;
      }

      paginator = next;
    }
  }

  protected get _isRateLimitOk() {
    const resetDate = this._rateLimit.reset * 1000;

    if (resetDate < Date.now()) {
      return true;
    }
    return this._rateLimit.remaining > 0;
  }
}
