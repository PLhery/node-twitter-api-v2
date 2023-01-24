import TwitterPaginator from './TwitterPaginator';
import {
  TwitterResponse,
  TweetV1,
  TweetV1TimelineResult,
  TweetV1TimelineParams,
  TweetV1UserTimelineParams,
  ListStatusesV1Params,
} from '../types';

/** A generic TwitterPaginator able to consume TweetV1 timelines. */
abstract class TweetTimelineV1Paginator<
  TResult extends TweetV1TimelineResult,
  TParams extends TweetV1TimelineParams,
  TShared = any,
> extends TwitterPaginator<TResult, TParams, TweetV1, TShared> {
  protected hasFinishedFetch = false;

  protected refreshInstanceFromResult(response: TwitterResponse<TResult>, isNextPage: true) {
    const result = response.data;
    this._rateLimit = response.rateLimit!;

    if (isNextPage) {
      this._realData.push(...result);
      // HINT: This is an approximation, as "end" of pagination cannot be safely determined without cursors.
      this.hasFinishedFetch = result.length === 0;
    }
  }

  protected getNextQueryParams(maxResults?: number) {
    const latestId = BigInt(this._realData[this._realData.length - 1].id_str);

    return {
      ...this.injectQueryParams(maxResults),
      max_id: (latestId - BigInt(1)).toString(),
    };
  }

  protected getPageLengthFromRequest(result: TwitterResponse<TResult>) {
    return result.data.length;
  }

  protected isFetchLastOver(result: TwitterResponse<TResult>) {
    return !result.data.length;
  }

  protected canFetchNextPage(result: TResult) {
    return result.length > 0;
  }

  protected getItemArray() {
    return this.tweets;
  }

  /**
   * Tweets returned by paginator.
   */
  get tweets() {
    return this._realData;
  }

  get done() {
    return super.done || this.hasFinishedFetch;
  }
}

// Timelines

// Home
export class HomeTimelineV1Paginator extends TweetTimelineV1Paginator<TweetV1TimelineResult, TweetV1TimelineParams> {
  protected _endpoint = 'statuses/home_timeline.json';
}

// Mention
export class MentionTimelineV1Paginator extends TweetTimelineV1Paginator<TweetV1TimelineResult, TweetV1TimelineParams> {
  protected _endpoint = 'statuses/mentions_timeline.json';
}

// User
export class UserTimelineV1Paginator extends TweetTimelineV1Paginator<TweetV1TimelineResult, TweetV1UserTimelineParams> {
  protected _endpoint = 'statuses/user_timeline.json';
}

// Lists
export class ListTimelineV1Paginator extends TweetTimelineV1Paginator<TweetV1TimelineResult, ListStatusesV1Params> {
  protected _endpoint = 'lists/statuses.json';
}

// Favorites
export class UserFavoritesV1Paginator extends TweetTimelineV1Paginator<TweetV1TimelineResult, TweetV1UserTimelineParams> {
  protected _endpoint = 'favorites/list.json';
}
