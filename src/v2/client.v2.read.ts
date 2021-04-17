import TwitterApiSubClient from '../client.subclient';
import { API_V2_PREFIX } from '../globals';
import {
  FollowersV2Result, FollowersV2Params, Tweetv2FieldsParams,
  Tweetv2SearchParams, Tweetv2SearchResult, UserV2Result,
  UsersV2Result, UsersV2Params, StreamingV2GetRulesParams,
  StreamingV2GetRulesResult, TweetV2LookupResult,
  TweetV2LookupParams, TweetV2UserTimelineParams,
  TweetV2UserTimelineResult,
  StreamingV2AddRulesParams,
  StreamingV2DeleteRulesParams,
  StreamingV2UpdateRulesParams,
  StreamingV2UpdateRulesQuery,
  StreamingV2UpdateRulesDeleteResult,
  StreamingV2UpdateRulesAddResult,
  StreamingV2UpdateRulesResult,
  TweetV2,
  TweetV2SingleResult,
} from '../types';
import {
  TweetSearchAllV2Paginator,
  TweetSearchRecentV2Paginator,
  TweetUserMentionTimelineV2Paginator,
  TweetUserTimelineV2Paginator,
} from '../paginators';
import TwitterApiv2LabsReadOnly from '../v2-labs/client.v2.labs.read';

/**
 * Base Twitter v2 client with only read right.
 */
export default class TwitterApiv2ReadOnly extends TwitterApiSubClient {
  protected _prefix = API_V2_PREFIX;
  protected _labs?: TwitterApiv2LabsReadOnly;

  /* Sub-clients */

  /**
   * Get a client for v2 labs endpoints.
   */
  public get labs() {
    if (this._labs) return this._labs;

    return this._labs = new TwitterApiv2LabsReadOnly(this);
  }

  /* Tweets */

  /**
   * The recent search endpoint returns Tweets from the last seven days that match a search query.
   * https://developer.twitter.com/en/docs/twitter-api/tweets/search/api-reference/get-tweets-search-recent
   */
  public async search(query: string, options: Partial<Tweetv2SearchParams> = {}) {
    const queryParams = {...options, query};
    const initialRq = await this.get<Tweetv2SearchResult>('tweets/search/recent', queryParams, { fullResponse: true });

    return new TweetSearchRecentV2Paginator({
      realData: initialRq.data,
      rateLimit: initialRq.rateLimit!,
      instance: this,
      queryParams,
    });
  }

  /**
   * The full-archive search endpoint returns the complete history of public Tweets matching a search query;
   * since the first Tweet was created March 26, 2006.
   *
   * This endpoint is only available to those users who have been approved for the Academic Research product track.
   * https://developer.twitter.com/en/docs/twitter-api/tweets/search/api-reference/get-tweets-search-all
   */
  public async searchAll(query: string, options: Partial<Tweetv2SearchParams> = {}) {
    const queryParams = {...options, query};
    const initialRq = await this.get<Tweetv2SearchResult>('tweets/search/all', queryParams, { fullResponse: true });

    return new TweetSearchAllV2Paginator({
      realData: initialRq.data,
      rateLimit: initialRq.rateLimit!,
      instance: this,
      queryParams,
    });
  }

  /**
   * Returns a variety of information about a single Tweet specified by the requested ID.
   * https://developer.twitter.com/en/docs/twitter-api/tweets/lookup/api-reference/get-tweets-id
   */
  public singleTweet(tweetId: string, options: Partial<Tweetv2FieldsParams> = {}) {
    return this.get<TweetV2LookupResult>(`tweets/${tweetId}`, options);
  }

  /**
   * Returns a variety of information about tweets specified by list of IDs.
   * https://developer.twitter.com/en/docs/twitter-api/tweets/lookup/api-reference/get-tweets
   */
  public tweets(tweetIds: string | string[], options: Partial<TweetV2LookupParams> = {}) {
    return this.get<TweetV2LookupResult>('tweets', { ids: tweetIds, ...options });
  }

  /**
   * Returns Tweets composed by a single user, specified by the requested user ID.
   * By default, the most recent ten Tweets are returned per request.
   * Using pagination, the most recent 3,200 Tweets can be retrieved.
   * https://developer.twitter.com/en/docs/twitter-api/tweets/timelines/api-reference/get-users-id-tweets
   */
  public async userTimeline(userId: string, options: Partial<TweetV2UserTimelineParams> = {}) {
    const initialRq = await this.get<TweetV2UserTimelineResult>(`users/${userId}/tweets`, options, { fullResponse: true });

    return new TweetUserTimelineV2Paginator({
      realData: initialRq.data,
      rateLimit: initialRq.rateLimit!,
      instance: this,
      queryParams: options,
      sharedParams: { userId },
    });
  }

  /**
   * Returns Tweets mentioning a single user specified by the requested user ID.
   * By default, the most recent ten Tweets are returned per request.
   * Using pagination, up to the most recent 800 Tweets can be retrieved.
   * https://developer.twitter.com/en/docs/twitter-api/tweets/timelines/api-reference/get-users-id-mentions
   */
  public async userMentionTimeline(userId: string, options: Partial<TweetV2UserTimelineParams> = {}) {
    const initialRq = await this.get<TweetV2UserTimelineResult>(`users/${userId}/mentions`, options, { fullResponse: true });

    return new TweetUserMentionTimelineV2Paginator({
      realData: initialRq.data,
      rateLimit: initialRq.rateLimit!,
      instance: this,
      queryParams: options,
      sharedParams: { userId },
    });
  }

  /* Users */

  /**
   * Returns a variety of information about a single user specified by the requested ID.
   * https://developer.twitter.com/en/docs/twitter-api/users/lookup/api-reference/get-users-id
   */
  public user(userId: string, options: Partial<UsersV2Params> = {}) {
    return this.get<UserV2Result>(`users/${userId}`, options);
  }

  /**
   * Returns a variety of information about one or more users specified by the requested IDs.
   * https://developer.twitter.com/en/docs/twitter-api/users/lookup/api-reference/get-users
   */
  public users(userIds: string | string[], options: Partial<UsersV2Params> = {}) {
    const ids = Array.isArray(userIds) ? userIds.join(',') : userIds;
    return this.get<UsersV2Result>(`users`, { ...options, ids });
  }

  /**
   * Returns a variety of information about a single user specified by their username.
   * https://developer.twitter.com/en/docs/twitter-api/users/lookup/api-reference/get-users-by-username-username
   */
  public userByUsername(username: string, options: Partial<UsersV2Params> = {}) {
    return this.get<UserV2Result>(`users/by/username/${username}`, options);
  }

  /**
   * Returns a variety of information about one or more users specified by their usernames.
   * https://developer.twitter.com/en/docs/twitter-api/users/lookup/api-reference/get-users-by
   */
  public usersByUsernames(usernames: string | string[], options: Partial<UsersV2Params> = {}) {
    usernames = Array.isArray(usernames) ? usernames.join(',') : usernames;
    return this.get<UsersV2Result>(`users/by`, { ...options, usernames });
  }

  /**
   * Returns a list of users who are followers of the specified user ID.
   * https://developer.twitter.com/en/docs/twitter-api/users/follows/api-reference/get-users-id-followers
   */
  public followers(userId: string, options: Partial<FollowersV2Params> = {}) {
    return this.get<FollowersV2Result>(`users/${userId}/followers`, options);
  }

  /**
   * Returns a list of users the specified user ID is following.
   * https://developer.twitter.com/en/docs/twitter-api/users/follows/api-reference/get-users-id-following
   */
  public following(userId: string, options: Partial<FollowersV2Params> = {}) {
    return this.get<FollowersV2Result>(`users/${userId}/following`, options);
  }

  /* Streaming API */

  /**
   * Streams Tweets in real-time based on a specific set of filter rules.
   * https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/api-reference/get-tweets-search-stream
   */
  public searchStream(options: Partial<Tweetv2FieldsParams> = {}) {
    return this.getStream<TweetV2SingleResult>('tweets/search/stream', options);
  }

  /**
   * Return a list of rules currently active on the streaming endpoint, either as a list or individually.
   * https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/api-reference/get-tweets-search-stream-rules
   */
  public streamRules(options: Partial<StreamingV2GetRulesParams> = {}) {
    return this.get<StreamingV2GetRulesResult>('tweets/search/stream/rules', options);
  }

  /**
   * Add or delete rules to your stream.
   * To create one or more rules, submit an add JSON body with an array of rules and operators.
   * Similarly, to delete one or more rules, submit a delete JSON body with an array of list of existing rule IDs.
   * https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/api-reference/post-tweets-search-stream-rules
   */
   public updateStreamRules(options: StreamingV2AddRulesParams, query?: Partial<StreamingV2UpdateRulesQuery>): Promise<StreamingV2UpdateRulesAddResult>;
   public updateStreamRules(options: StreamingV2DeleteRulesParams, query?: Partial<StreamingV2UpdateRulesQuery>): Promise<StreamingV2UpdateRulesDeleteResult>;
   public updateStreamRules(options: StreamingV2UpdateRulesParams, query: Partial<StreamingV2UpdateRulesQuery> = {}) {
     return this.post<StreamingV2UpdateRulesResult>(
       'tweets/search/stream/rules',
       options,
       { query },
     );
   }

  /**
   * Streams about 1% of all Tweets in real-time.
   * https://developer.twitter.com/en/docs/twitter-api/tweets/sampled-stream/api-reference/get-tweets-sample-stream
   */
  public sampleStream(options: Partial<Tweetv2FieldsParams> = {}) {
    return this.getStream<TweetV2SingleResult>('tweets/sample/stream', options);
  }
}
