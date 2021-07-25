import { PreviousableTwitterPaginator } from './TwitterPaginator';
import {
  Tweetv2SearchParams,
  Tweetv2SearchResult,
  TwitterResponse,
  TweetV2,
  Tweetv2TimelineResult,
  TweetV2TimelineParams,
  TweetV2UserTimelineResult,
  TweetV2UserTimelineParams,
} from '../types';

/** A generic PreviousableTwitterPaginator able to consume TweetV2 timelines. */
abstract class TweetTimelineV2Paginator<
  TResult extends Tweetv2TimelineResult,
  TParams extends TweetV2TimelineParams,
  TShared = any,
> extends PreviousableTwitterPaginator<TResult, TParams, TweetV2, TShared> {
  protected refreshInstanceFromResult(response: TwitterResponse<TResult>, isNextPage: boolean) {
    const result = response.data;
    this._rateLimit = response.rateLimit!;
    if (result.data) {
      if (isNextPage) {
        this._realData.meta.oldest_id = result.meta.oldest_id
        this._realData.meta.result_count += result.meta.result_count
        this._realData.meta.next_token = result.meta.next_token
        this._realData.data.push(...result.data)
      }
      else {
        this._realData.meta.newest_id = result.meta.newest_id
        this._realData.meta.result_count += result.meta.result_count
        this._realData.data.unshift(...result.data)
      }
    }
  }

  protected getNextQueryParams(maxResults?: number) {
    return {
      ...this._queryParams,
      until_id: this._realData.meta.oldest_id,
      ...(maxResults ? { max_results: maxResults } : {})
    };
  }

  protected getPreviousQueryParams(maxResults?: number) {
    return {
      ...this._queryParams,
      since_id: this._realData.meta.newest_id,
      ...(maxResults ? { max_results: maxResults } : {})
    };
  }

  protected getPageLengthFromRequest(result: TwitterResponse<TResult>) {
    return result.data?.data?.length||0;
  }

  protected isFetchLastOver(result: TwitterResponse<TResult>) {
    return !result.data?.data?.length || !result.data.meta.next_token;
  }

  protected getItemArray() {
    return this.tweets;
  }

  /**
   * Tweets returned by paginator.
   */
  get tweets() {
    return this._realData.data;
  }
  
  //includes object returned by paginator
  get includes() {
    return this._realData.includes;
  }
}

// ----------------
// - Tweet search -
// ----------------

export class TweetSearchRecentV2Paginator extends TweetTimelineV2Paginator<Tweetv2SearchResult, Tweetv2SearchParams> {
  protected _endpoint = 'tweets/search/recent';
}

export class TweetSearchAllV2Paginator extends TweetTimelineV2Paginator<Tweetv2SearchResult, Tweetv2SearchParams> {
  protected _endpoint = 'tweets/search/all';
}

// -----------------
// - User timeline -
// -----------------

type TUserTimelinePaginatorShared = { userId: string };

export class TweetUserTimelineV2Paginator
  extends TweetTimelineV2Paginator<TweetV2UserTimelineResult, TweetV2UserTimelineParams, TUserTimelinePaginatorShared>
{
  protected _endpoint = 'users/:id/tweets';

  protected getEndpoint() {
    return this._endpoint.replace(':id', this._sharedParams.userId);
  }
}

export class TweetUserMentionTimelineV2Paginator
  extends TweetTimelineV2Paginator<TweetV2UserTimelineResult, TweetV2UserTimelineParams, TUserTimelinePaginatorShared>
{
  protected _endpoint = 'users/:id/mentions';

  protected getEndpoint() {
    return this._endpoint.replace(':id', this._sharedParams.userId);
  }
}
