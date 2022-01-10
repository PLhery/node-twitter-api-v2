import {
  Tweetv2SearchParams,
  Tweetv2SearchResult,
  TwitterResponse,
  TweetV2,
  Tweetv2TimelineResult,
  TweetV2TimelineParams,
  TweetV2UserTimelineResult,
  TweetV2UserTimelineParams,
  Tweetv2ListResult,
  TweetV2PaginableListParams,
  TweetV2PaginableTimelineParams,
} from '../types';
import { TimelineV2Paginator, TwitterV2Paginator } from './v2.paginator';

/** A generic PreviousableTwitterPaginator able to consume TweetV2 timelines with since_id, until_id and next_token (when available). */
abstract class TweetTimelineV2Paginator<
  TResult extends Tweetv2TimelineResult,
  TParams extends TweetV2TimelineParams,
  TShared = any,
> extends TwitterV2Paginator<TResult, TParams, TweetV2, TShared> {
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
    this.assertUsable();

    const params: Partial<TParams> = { ...this.injectQueryParams(maxResults) };

    if (this._realData.meta.next_token) {
      params.next_token = this._realData.meta.next_token;
    } else {
      params.until_id = this._realData.meta.oldest_id;
    }

    return params;
  }

  protected getPreviousQueryParams(maxResults?: number) {
    this.assertUsable();

    return {
      ...this.injectQueryParams(maxResults),
      since_id: this._realData.meta.newest_id,
    } as Partial<TParams>;
  }

  protected getPageLengthFromRequest(result: TwitterResponse<TResult>) {
    return result.data.data?.length ?? 0;
  }

  protected isFetchLastOver(result: TwitterResponse<TResult>) {
    return !result.data.data?.length || !this.canFetchNextPage(result.data);
  }

  protected canFetchNextPage(result: TResult) {
    return !!result.meta.next_token;
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
}

/** A generic PreviousableTwitterPaginator able to consume TweetV2 timelines with since_id, until_id and pagination_token (when available). */
abstract class TweetPaginableTimelineV2Paginator<
  TResult extends TweetV2UserTimelineResult,
  TParams extends TweetV2PaginableTimelineParams,
  TShared = any,
> extends TweetTimelineV2Paginator<TResult, TParams, TShared> {
  protected refreshInstanceFromResult(response: TwitterResponse<TResult>, isNextPage: boolean) {
    super.refreshInstanceFromResult(response, isNextPage);

    if (!isNextPage) {
      this._realData.meta.previous_token = response.data.meta.previous_token;
    }
  }

  protected getNextQueryParams(maxResults?: number) {
    this.assertUsable();

    const params: Partial<TParams> = { ...this.injectQueryParams(maxResults) };

    if (this._realData.meta.next_token) {
      params.pagination_token = this._realData.meta.next_token;
    } else {
      params.until_id = this._realData.meta.oldest_id;
    }

    return params;
  }

  protected getPreviousQueryParams(maxResults?: number) {
    this.assertUsable();

    const params: Partial<TParams> = { ...this.injectQueryParams(maxResults) };

    if (this._realData.meta.previous_token) {
      params.pagination_token = this._realData.meta.previous_token;
    } else {
      params.since_id = this._realData.meta.newest_id;
    }

    return params;
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
  extends TweetPaginableTimelineV2Paginator<TweetV2UserTimelineResult, TweetV2UserTimelineParams, TUserTimelinePaginatorShared>
{
  protected _endpoint = 'users/:id/tweets';
}

export class TweetUserMentionTimelineV2Paginator
  extends TweetPaginableTimelineV2Paginator<TweetV2UserTimelineResult, TweetV2PaginableTimelineParams, TUserTimelinePaginatorShared>
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
> extends TimelineV2Paginator<TResult, TParams, TweetV2, TShared> {
  /**
   * Tweets returned by paginator.
   */
  get tweets() {
    return this._realData.data ?? [];
  }

  protected getItemArray() {
    return this.tweets;
  }
}

export class TweetV2UserLikedTweetsPaginator
  extends TweetListV2Paginator<Tweetv2ListResult, TweetV2PaginableListParams, TUserTimelinePaginatorShared>
{
  protected _endpoint = 'users/:id/liked_tweets';
}

export class TweetV2ListTweetsPaginator
  extends TweetListV2Paginator<Tweetv2ListResult, TweetV2PaginableListParams, TUserTimelinePaginatorShared>
{
  protected _endpoint = 'lists/:id/tweets';
}
