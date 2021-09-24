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
  ApiV2Includes,
  Tweetv2ListResult,
  TweetV2PaginableListParams,
  Tweetv2FieldsParams,
} from '../types';

/** A generic PreviousableTwitterPaginator able to consume TweetV2[]. */
abstract class TweetsV2Paginator<
  TResult extends Tweetv2ListResult,
  TParams extends Partial<Tweetv2FieldsParams>,
  TShared = any,
> extends PreviousableTwitterPaginator<TResult, TParams, TweetV2, TShared> {
  protected updateIncludes(data: TResult) {
    if (!data.includes) {
      return;
    }
    if (!this._realData.includes) {
      this._realData.includes = {};
    }

    const includesRealData = this._realData.includes;

    for (const [includeKey, includeArray] of Object.entries(data.includes) as [keyof ApiV2Includes, any[]][]) {
      if (!includesRealData[includeKey]) {
        includesRealData[includeKey] = [];
      }

      includesRealData[includeKey] = [
        ...includesRealData[includeKey]!,
        ...includeArray,
      ];
    }
  }

  protected getPageLengthFromRequest(result: TwitterResponse<TResult>) {
    return result.data.data?.length ?? 0;
  }

  protected isFetchLastOver(result: TwitterResponse<TResult>) {
    return !result.data.data?.length || !result.data.meta.next_token;
  }

  protected getItemArray() {
    return this.tweets;
  }

  /**
   * Tweets returned by paginator.
   */
  get tweets() {
    return this._realData.data ?? [];
  }

  get meta() {
    return this._realData.meta;
  }

  get includes() {
    return this._realData.includes ?? {};
  }
}

/** A generic PreviousableTwitterPaginator able to consume TweetV2 timelines. */
abstract class TweetTimelineV2Paginator<
  TResult extends Tweetv2TimelineResult,
  TParams extends TweetV2TimelineParams,
  TShared = any,
> extends TweetsV2Paginator<TResult, TParams, TShared> {
  protected refreshInstanceFromResult(response: TwitterResponse<TResult>, isNextPage: boolean) {
    const result = response.data;
    const resultData = result.data ?? [];
    this._rateLimit = response.rateLimit!;

    if (!this._realData.data) {
      this._realData.data = [];
    }

    if (isNextPage) {
      this._realData.meta.oldest_id = result.meta.oldest_id;
      this._realData.meta.result_count += result.meta.result_count;
      this._realData.meta.next_token = result.meta.next_token;
      this._realData.data.push(...resultData);
    }
    else {
      this._realData.meta.newest_id = result.meta.newest_id;
      this._realData.meta.result_count += result.meta.result_count;
      this._realData.data.unshift(...resultData);
    }

    this.updateIncludes(result);
  }

  protected getNextQueryParams(maxResults?: number) {
    return {
      ...this.injectQueryParams(maxResults),
      until_id: this._realData.meta.oldest_id,
    };
  }

  protected getPreviousQueryParams(maxResults?: number) {
    return {
      ...this.injectQueryParams(maxResults),
      since_id: this._realData.meta.newest_id,
    };
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

type TUserTimelinePaginatorShared = { id: string };

export class TweetUserTimelineV2Paginator
  extends TweetTimelineV2Paginator<TweetV2UserTimelineResult, TweetV2UserTimelineParams, TUserTimelinePaginatorShared>
{
  protected _endpoint = 'users/:id/tweets';
}

export class TweetUserMentionTimelineV2Paginator
  extends TweetTimelineV2Paginator<TweetV2UserTimelineResult, TweetV2UserTimelineParams, TUserTimelinePaginatorShared>
{
  protected _endpoint = 'users/:id/mentions';
}

// ---------------------------------------------------------------------------------
// - Tweet lists (consume tweets with pagination tokens instead of since/until id) -
// ---------------------------------------------------------------------------------

/** A generic TwitterPaginator able to consume TweetV2 timelines. */
abstract class TweetListV2Paginator<
  TResult extends Tweetv2ListResult,
  TParams extends TweetV2PaginableListParams,
  TShared = any,
> extends TweetsV2Paginator<TResult, TParams, TShared> {
  protected refreshInstanceFromResult(response: TwitterResponse<TResult>, isNextPage: boolean) {
    const result = response.data;
    const resultData = result.data ?? [];
    this._rateLimit = response.rateLimit!;

    if (!this._realData.data) {
      this._realData.data = [];
    }

    if (isNextPage) {
      this._realData.meta.result_count += result.meta.result_count;
      this._realData.meta.next_token = result.meta.next_token;
      this._realData.data.push(...resultData);
    }
    else {
      this._realData.meta.result_count += result.meta.result_count;
      this._realData.meta.previous_token = result.meta.previous_token;
      this._realData.data.unshift(...resultData);
    }

    this.updateIncludes(result);
  }

  protected getNextQueryParams(maxResults?: number) {
    return {
      ...this.injectQueryParams(maxResults),
      pagination_token: this._realData.meta.next_token,
    };
  }

  protected getPreviousQueryParams(maxResults?: number) {
    return {
      ...this.injectQueryParams(maxResults),
      pagination_token: this._realData.meta.previous_token,
    };
  }
}

export class TweetV2UserLikedTweetsPaginator
  extends TweetListV2Paginator<Tweetv2ListResult, TweetV2PaginableListParams, TUserTimelinePaginatorShared>
{
  protected _endpoint = 'users/:id/liked_tweets';
}
