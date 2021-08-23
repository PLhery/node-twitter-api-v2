import TwitterApiSubClient from '../client.subclient';
import { API_V2_PREFIX } from '../globals';
import {
  Tweetv2FieldsParams,
  Tweetv2SearchParams, Tweetv2SearchResult, UserV2Result,
  UsersV2Result, UsersV2Params, StreamingV2GetRulesParams,
  StreamingV2GetRulesResult, TweetV2LookupResult,
  TweetV2UserTimelineParams,
  TweetV2UserTimelineResult,
  StreamingV2AddRulesParams,
  StreamingV2DeleteRulesParams,
  StreamingV2UpdateRulesParams,
  StreamingV2UpdateRulesQuery,
  StreamingV2UpdateRulesDeleteResult,
  StreamingV2UpdateRulesAddResult,
  StreamingV2UpdateRulesResult,
  TweetV2SingleResult,
  TweetV2PaginableTimelineParams,
  TweetV2CountResult,
  TweetV2CountParams,
  TweetV2CountAllResult,
  TweetV2CountAllParams,
  TweetV2RetweetedByResult,
  TweetV2LikedByResult,
  UserV2TimelineParams,
  UserV2TimelineResult,
  FollowersV2ParamsWithPaginator,
  FollowersV2Params,
  FollowersV2ParamsWithoutPaginator,
  TweetSearchV2StreamParams,
  TweetV2SingleStreamResult,
  TweetV2PaginableListParams,
  Tweetv2ListResult,
  SpaceV2FieldsParams,
  SpaceV2LookupResult,
  SpaceV2CreatorLookupParams,
  SpaceV2SearchParams,
  SpaceV2SingleResult,
} from '../types';
import {
  TweetSearchAllV2Paginator,
  TweetSearchRecentV2Paginator,
  TweetUserMentionTimelineV2Paginator,
  TweetUserTimelineV2Paginator,
  TweetV2UserLikedTweetsPaginator,
} from '../paginators';
import TwitterApiv2LabsReadOnly from '../v2-labs/client.v2.labs.read';
import { UserBlockingUsersV2Paginator, UserFollowersV2Paginator, UserFollowingV2Paginator } from '../paginators/user.paginator.v2';
import { isTweetStreamV2ErrorPayload } from '../helpers';

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
    return this.get<TweetV2SingleResult>(`tweets/${tweetId}`, options);
  }

  /**
   * Returns a variety of information about tweets specified by list of IDs.
   * https://developer.twitter.com/en/docs/twitter-api/tweets/lookup/api-reference/get-tweets
   */
  public tweets(tweetIds: string | string[], options: Partial<Tweetv2FieldsParams> = {}) {
    return this.get<TweetV2LookupResult>('tweets', { ids: tweetIds, ...options });
  }

  /**
   * The recent Tweet counts endpoint returns count of Tweets from the last seven days that match a search query.
   * OAuth2 Bearer auth only.
   * https://developer.twitter.com/en/docs/twitter-api/tweets/counts/api-reference/get-tweets-counts-recent
   */
  public tweetCountRecent(query: string, options: Partial<TweetV2CountParams> = {}) {
    return this.get<TweetV2CountResult>('tweets/counts/recent', { query, ...options });
  }

  /**
   * This endpoint is only available to those users who have been approved for the Academic Research product track.
   * The full-archive search endpoint returns the complete history of public Tweets matching a search query;
   * since the first Tweet was created March 26, 2006.
   * OAuth2 Bearer auth only.
   * **This endpoint has pagination, yet it is not supported by bundled paginators. Use `next_token` to fetch next page.**
   * https://developer.twitter.com/en/docs/twitter-api/tweets/counts/api-reference/get-tweets-counts-all
   */
  public tweetCountAll(query: string, options: Partial<TweetV2CountAllParams> = {}) {
    return this.get<TweetV2CountAllResult>('tweets/counts/all', { query, ...options });
  }

  /**
   * Allows you to get information about who has Retweeted a Tweet.
   * https://developer.twitter.com/en/docs/twitter-api/tweets/retweets/api-reference/get-tweets-id-retweeted_by
   */
  public tweetRetweetedBy(tweetId: string, options: Partial<UsersV2Params> = {}) {
    return this.get<TweetV2RetweetedByResult>(`tweets/${tweetId}/retweeted_by`, options);
  }

  /**
   * Allows you to get information about who has Liked a Tweet.
   * https://developer.twitter.com/en/docs/twitter-api/tweets/likes/api-reference/get-tweets-id-liking_users
   */
  public tweetLikedBy(tweetId: string, options: Partial<UsersV2Params> = {}) {
    return this.get<TweetV2LikedByResult>(`tweets/${tweetId}/liking_users`, options);
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
  public async userMentionTimeline(userId: string, options: Partial<TweetV2PaginableTimelineParams> = {}) {
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
    return this.get<UsersV2Result>('users', { ...options, ids });
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
    return this.get<UsersV2Result>('users/by', { ...options, usernames });
  }

  /**
   * Returns a list of users who are followers of the specified user ID.
   * https://developer.twitter.com/en/docs/twitter-api/users/follows/api-reference/get-users-id-followers
   */
  public followers(userId: string, options?: Partial<FollowersV2ParamsWithoutPaginator>): Promise<UserV2TimelineResult>;
  public followers(userId: string, options: FollowersV2ParamsWithPaginator): Promise<UserFollowersV2Paginator>;
  public async followers(userId: string, options: FollowersV2Params = {}) {
    const { asPaginator, ...parameters } = options;

    if (!asPaginator) {
      return this.get<UserV2TimelineResult>(`users/${userId}/followers`, parameters as Partial<UserV2TimelineParams>);
    }

    const initialRq = await this.get<UserV2TimelineResult>(`users/${userId}/followers`, parameters as Partial<UserV2TimelineParams>, { fullResponse: true });

    return new UserFollowersV2Paginator({
      realData: initialRq.data,
      rateLimit: initialRq.rateLimit!,
      instance: this,
      queryParams: parameters as Partial<UserV2TimelineParams>,
      sharedParams: { userId },
    });
  }

  /**
   * Returns a list of users the specified user ID is following.
   * https://developer.twitter.com/en/docs/twitter-api/users/follows/api-reference/get-users-id-following
   */
  public following(userId: string, options?: Partial<FollowersV2ParamsWithoutPaginator>): Promise<UserV2TimelineResult>;
  public following(userId: string, options: FollowersV2ParamsWithPaginator): Promise<UserFollowingV2Paginator>;
  public async following(userId: string, options: FollowersV2Params = {}) {
    const { asPaginator, ...parameters } = options;

    if (!asPaginator) {
      return this.get<UserV2TimelineResult>(`users/${userId}/following`, parameters as Partial<UserV2TimelineParams>);
    }

    const initialRq = await this.get<UserV2TimelineResult>(`users/${userId}/following`, parameters as Partial<UserV2TimelineParams>, { fullResponse: true });

    return new UserFollowingV2Paginator({
      realData: initialRq.data,
      rateLimit: initialRq.rateLimit!,
      instance: this,
      queryParams: parameters as Partial<UserV2TimelineParams>,
      sharedParams: { userId },
    });
  }

  /**
   * Allows you to get information about a user’s liked Tweets.
   * https://developer.twitter.com/en/docs/twitter-api/tweets/likes/api-reference/get-users-id-liked_tweets
   */
  public async userLikedTweets(userId: string, options: Partial<TweetV2PaginableListParams> = {}) {
    const initialRq = await this.get<Tweetv2ListResult>(`users/${userId}/liked_tweets`, options, { fullResponse: true });

    return new TweetV2UserLikedTweetsPaginator({
      realData: initialRq.data,
      rateLimit: initialRq.rateLimit!,
      instance: this,
      queryParams: { ...options },
      sharedParams: { userId },
    });
  }

  /**
   * Returns a list of users who are blocked by the specified user ID. User ID must be the authenticating user.
   * https://developer.twitter.com/en/docs/twitter-api/users/blocks/api-reference/get-users-blocking
   */
   public async userBlockingUsers(userId: string, options: Partial<UserV2TimelineParams> = {}) {
    const initialRq = await this.get<UserV2TimelineResult>(`users/${userId}/blocking`, options, { fullResponse: true });

    return new UserBlockingUsersV2Paginator({
      realData: initialRq.data,
      rateLimit: initialRq.rateLimit!,
      instance: this,
      queryParams: { ...options },
      sharedParams: { userId },
    });
  }

  /* Spaces */

  /**
   * Get a single space by ID.
   * https://developer.twitter.com/en/docs/twitter-api/spaces/lookup/api-reference/get-spaces-id
   */
  public space(spaceId: string, options: Partial<SpaceV2FieldsParams> = {}) {
    return this.get<SpaceV2SingleResult>(`spaces/${spaceId}`, options);
  }

  /**
   * Get spaces using their IDs.
   * https://developer.twitter.com/en/docs/twitter-api/spaces/lookup/api-reference/get-spaces
   */
  public spaces(spaceIds: string | string[], options: Partial<SpaceV2FieldsParams> = {}) {
    return this.get<SpaceV2LookupResult>('spaces', { ids: spaceIds, ...options });
  }

  /**
   * Get spaces using their creator user ID(s). (no pagination available)
   * https://developer.twitter.com/en/docs/twitter-api/spaces/lookup/api-reference/get-spaces-by-creator-ids
   */
  public spacesByCreators(creatorIds: string | string[], options: Partial<SpaceV2CreatorLookupParams> = {}) {
    return this.get<SpaceV2LookupResult>('spaces/by/creator_ids', { user_ids: creatorIds, ...options });
  }

  /**
   * Search through spaces using multiple params. (no pagination available)
   * https://developer.twitter.com/en/docs/twitter-api/spaces/search/api-reference/get-spaces-search
   */
  public searchSpaces(options: SpaceV2SearchParams) {
    return this.get<SpaceV2LookupResult>('spaces/search', options as Partial<SpaceV2SearchParams>);
  }

  /* Streaming API */

  /**
   * Streams Tweets in real-time based on a specific set of filter rules.
   * https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/api-reference/get-tweets-search-stream
   */
  public searchStream(options: Partial<TweetSearchV2StreamParams> = {}) {
    return this.getStream<TweetV2SingleStreamResult>('tweets/search/stream', options, { payloadIsError: isTweetStreamV2ErrorPayload });
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
    return this.getStream<TweetV2SingleResult>('tweets/sample/stream', options, { payloadIsError: isTweetStreamV2ErrorPayload });
  }
}
