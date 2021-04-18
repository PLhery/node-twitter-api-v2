import TwitterPaginator from './TwitterPaginator';
import {
  TwitterResponse,
  TweetV1,
  TweetV1TimelineResult,
  TweetV1TimelineParams,
  TweetV1UserTimelineParams,
} from '../types';

/** A generic TwitterPaginator able to consume TweetV1 timelines. */
abstract class TweetTimelineV1Paginator<
  TResult extends TweetV1TimelineResult,
  TParams extends TweetV1TimelineParams,
  TShared = any,
> extends TwitterPaginator<TResult, TParams, TweetV1, TShared> {
  protected refreshInstanceFromResult(response: TwitterResponse<TResult>, isNextPage: true) {
    const result = response.data;
    this._rateLimit = response.rateLimit!;

    if (isNextPage) {
      this._realData.push(...result);
    }
  }

  protected getNextQueryParams(maxResults?: number) {
    const lastestId = BigInt(this._realData[this._realData.length - 1].id_str);

    return {
      ...this._queryParams,
      max_id: (lastestId - BigInt(1)).toString(),
      ...(maxResults ? { max_results: maxResults } : {})
    };
  }

  protected getPageLengthFromRequest(result: TwitterResponse<TResult>) {
    return result.data.length;
  }

  protected isFetchLastOver(result: TwitterResponse<TResult>) {
    return !result.data.length;
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
