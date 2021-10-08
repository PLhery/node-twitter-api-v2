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
  BatchComplianceSearchV2Params,
  BatchComplianceListV2Result,
  BatchComplianceV2Result,
  BatchComplianceV2Params,
  BatchComplianceV2JobResult,
  BatchComplianceJobV2,
} from '../types';
import {
  TweetSearchAllV2Paginator,
  TweetSearchRecentV2Paginator,
  TweetUserMentionTimelineV2Paginator,
  TweetUserTimelineV2Paginator,
  TweetV2UserLikedTweetsPaginator,
} from '../paginators';
import TwitterApiv2LabsReadOnly from '../v2-labs/client.v2.labs.read';
import { UserBlockingUsersV2Paginator, UserFollowersV2Paginator, UserFollowingV2Paginator, UserMutingUsersV2Paginator } from '../paginators/user.paginator.v2';
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
    const queryParams = { ...options, query };
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
    const queryParams = { ...options, query };
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
   *
   * OAuth2 scope: `users.read`, `tweet.read`
   */
  public singleTweet(tweetId: string, options: Partial<Tweetv2FieldsParams> = {}) {
    return this.get<TweetV2SingleResult>('tweets/:id', options, { params: { id: tweetId } });
  }

  /**
   * Returns a variety of information about tweets specified by list of IDs.
   * https://developer.twitter.com/en/docs/twitter-api/tweets/lookup/api-reference/get-tweets
   *
   * OAuth2 scope: `users.read`, `tweet.read`
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
    return this.get<TweetV2RetweetedByResult>('tweets/:id/retweeted_by', options, { params: { id: tweetId } });
  }

  /**
   * Allows you to get information about who has Liked a Tweet.
   * https://developer.twitter.com/en/docs/twitter-api/tweets/likes/api-reference/get-tweets-id-liking_users
   */
  public tweetLikedBy(tweetId: string, options: Partial<UsersV2Params> = {}) {
    return this.get<TweetV2LikedByResult>('tweets/:id/liking_users', options, { params: { id: tweetId } });
  }

  /**
   * Returns Tweets composed by a single user, specified by the requested user ID.
   * By default, the most recent ten Tweets are returned per request.
   * Using pagination, the most recent 3,200 Tweets can be retrieved.
   * https://developer.twitter.com/en/docs/twitter-api/tweets/timelines/api-reference/get-users-id-tweets
   */
  public async userTimeline(userId: string, options: Partial<TweetV2UserTimelineParams> = {}) {
    const initialRq = await this.get<TweetV2UserTimelineResult>('users/:id/tweets', options, {
      fullResponse: true,
      params: { id: userId },
    });

    return new TweetUserTimelineV2Paginator({
      realData: initialRq.data,
      rateLimit: initialRq.rateLimit!,
      instance: this,
      queryParams: options,
      sharedParams: { id: userId },
    });
  }

  /**
   * Returns Tweets mentioning a single user specified by the requested user ID.
   * By default, the most recent ten Tweets are returned per request.
   * Using pagination, up to the most recent 800 Tweets can be retrieved.
   * https://developer.twitter.com/en/docs/twitter-api/tweets/timelines/api-reference/get-users-id-mentions
   */
  public async userMentionTimeline(userId: string, options: Partial<TweetV2PaginableTimelineParams> = {}) {
    const initialRq = await this.get<TweetV2UserTimelineResult>('users/:id/mentions', options, {
      fullResponse: true,
      params: { id: userId },
    });

    return new TweetUserMentionTimelineV2Paginator({
      realData: initialRq.data,
      rateLimit: initialRq.rateLimit!,
      instance: this,
      queryParams: options,
      sharedParams: { id: userId },
    });
  }

  /* Users */

  /**
   * Returns a variety of information about a single user specified by the requested ID.
   * https://developer.twitter.com/en/docs/twitter-api/users/lookup/api-reference/get-users-id
   */
  public user(userId: string, options: Partial<UsersV2Params> = {}) {
    return this.get<UserV2Result>('users/:id', options, { params: { id: userId } });
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
    return this.get<UserV2Result>('users/by/username/:username', options, { params: { username } });
  }

  /**
   * Returns a variety of information about one or more users specified by their usernames.
   * https://developer.twitter.com/en/docs/twitter-api/users/lookup/api-reference/get-users-by
   *
   * OAuth2 scope: `users.read`, `tweet.read`
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
    const params = { id: userId };

    if (!asPaginator) {
      return this.get<UserV2TimelineResult>('users/:id/followers', parameters as Partial<UserV2TimelineParams>, { params });
    }

    const initialRq = await this.get<UserV2TimelineResult>('users/:id/followers', parameters as Partial<UserV2TimelineParams>, { fullResponse: true, params });

    return new UserFollowersV2Paginator({
      realData: initialRq.data,
      rateLimit: initialRq.rateLimit!,
      instance: this,
      queryParams: parameters as Partial<UserV2TimelineParams>,
      sharedParams: params,
    });
  }

  /**
   * Returns a list of users the specified user ID is following.
   * https://developer.twitter.com/en/docs/twitter-api/users/follows/api-reference/get-users-id-following
   *
   * OAuth2 scope: `account.follows.read`
   */
  public following(userId: string, options?: Partial<FollowersV2ParamsWithoutPaginator>): Promise<UserV2TimelineResult>;
  public following(userId: string, options: FollowersV2ParamsWithPaginator): Promise<UserFollowingV2Paginator>;
  public async following(userId: string, options: FollowersV2Params = {}) {
    const { asPaginator, ...parameters } = options;
    const params = { id: userId };

    if (!asPaginator) {
      return this.get<UserV2TimelineResult>('users/:id/following', parameters as Partial<UserV2TimelineParams>, { params });
    }

    const initialRq = await this.get<UserV2TimelineResult>('users/:id/following', parameters as Partial<UserV2TimelineParams>, { fullResponse: true, params });

    return new UserFollowingV2Paginator({
      realData: initialRq.data,
      rateLimit: initialRq.rateLimit!,
      instance: this,
      queryParams: parameters as Partial<UserV2TimelineParams>,
      sharedParams: params,
    });
  }

  /**
   * Allows you to get information about a user’s liked Tweets.
   * https://developer.twitter.com/en/docs/twitter-api/tweets/likes/api-reference/get-users-id-liked_tweets
   */
  public async userLikedTweets(userId: string, options: Partial<TweetV2PaginableListParams> = {}) {
    const params = { id: userId };
    const initialRq = await this.get<Tweetv2ListResult>('users/:id/liked_tweets', options, { fullResponse: true, params });

    return new TweetV2UserLikedTweetsPaginator({
      realData: initialRq.data,
      rateLimit: initialRq.rateLimit!,
      instance: this,
      queryParams: { ...options },
      sharedParams: params,
    });
  }

  /**
   * Returns a list of users who are blocked by the authenticating user.
   * https://developer.twitter.com/en/docs/twitter-api/users/blocks/api-reference/get-users-blocking
   */
  public async userBlockingUsers(userId: string, options: Partial<UserV2TimelineParams> = {}) {
    const params = { id: userId };
    const initialRq = await this.get<UserV2TimelineResult>('users/:id/blocking', options, { fullResponse: true, params });

    return new UserBlockingUsersV2Paginator({
      realData: initialRq.data,
      rateLimit: initialRq.rateLimit!,
      instance: this,
      queryParams: { ...options },
      sharedParams: params,
    });
  }

  /**
   * Returns a list of users who are muted by the authenticating user.
   * https://developer.twitter.com/en/docs/twitter-api/users/mutes/api-reference/get-users-muting
   */
  public async userMutingUsers(options: Partial<UserV2TimelineParams> = {}) {
    const { id_str: userId } = await this.getCurrentUserObject();
    const params = { id: userId };
    const initialRq = await this.get<UserV2TimelineResult>('users/:id/muting', options, { fullResponse: true, params });

    return new UserMutingUsersV2Paginator({
      realData: initialRq.data,
      rateLimit: initialRq.rateLimit!,
      instance: this,
      queryParams: { ...options },
      sharedParams: params,
    });
  }

  /* Spaces */

  /**
   * Get a single space by ID.
   * https://developer.twitter.com/en/docs/twitter-api/spaces/lookup/api-reference/get-spaces-id
   *
   * OAuth2 scopes: `tweet.read`, `users.read`, `space.read`.
   */
  public space(spaceId: string, options: Partial<SpaceV2FieldsParams> = {}) {
    return this.get<SpaceV2SingleResult>('spaces/:id', options, { params: { id: spaceId } });
  }

  /**
   * Get spaces using their IDs.
   * https://developer.twitter.com/en/docs/twitter-api/spaces/lookup/api-reference/get-spaces
   *
   * OAuth2 scopes: `tweet.read`, `users.read`, `space.read`.
   */
  public spaces(spaceIds: string | string[], options: Partial<SpaceV2FieldsParams> = {}) {
    return this.get<SpaceV2LookupResult>('spaces', { ids: spaceIds, ...options });
  }

  /**
   * Get spaces using their creator user ID(s). (no pagination available)
   * https://developer.twitter.com/en/docs/twitter-api/spaces/lookup/api-reference/get-spaces-by-creator-ids
   *
   * OAuth2 scopes: `tweet.read`, `users.read`, `space.read`.
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

  /* Batch compliance */

  /**
   * Returns a list of recent compliance jobs.
   * https://developer.twitter.com/en/docs/twitter-api/compliance/batch-compliance/api-reference/get-compliance-jobs
   */
  public complianceJobs(options: BatchComplianceSearchV2Params) {
    return this.get<BatchComplianceListV2Result>('compliance/jobs', options as Partial<BatchComplianceSearchV2Params>);
  }

  /**
   * Get a single compliance job with the specified ID.
   * https://developer.twitter.com/en/docs/twitter-api/compliance/batch-compliance/api-reference/get-compliance-jobs-id
   */
  public complianceJob(jobId: string) {
    return this.get<BatchComplianceV2Result>('compliance/jobs/:id', undefined, { params: { id: jobId } });
  }

  /**
   * Creates a new compliance job for Tweet IDs or user IDs, send your file, await result and parse it into an array.
   * You can run one batch job at a time. Returns the created job, but **not the job result!**.
   *
   * You can obtain the result (**after job is completed**) with `.complianceJobResult`.
   * https://developer.twitter.com/en/docs/twitter-api/compliance/batch-compliance/api-reference/post-compliance-jobs
   */
  public async sendComplianceJob(jobParams: BatchComplianceV2Params) {
    const job = await this.post<BatchComplianceV2Result>('compliance/jobs', { type: jobParams.type, name: jobParams.name });

    // Send the IDs
    const rawIdsBody = jobParams.ids instanceof Buffer ? jobParams.ids : Buffer.from(jobParams.ids.join('\n'));
    // Upload the IDs
    await this.put<void>(job.data.upload_url, rawIdsBody, {
      forceBodyMode: 'raw',
      enableAuth: false,
      headers: { 'Content-Type': 'text/plain' },
      prefix: '',
    });

    return job;
  }

  /**
   * Get the result of a running or completed job, obtained through `.complianceJob`, `.complianceJobs` or `.sendComplianceJob`.
   * If job is still running (`in_progress`), it will await until job is completed. **This could be quite long!**
   * https://developer.twitter.com/en/docs/twitter-api/compliance/batch-compliance/api-reference/post-compliance-jobs
   */
  public async complianceJobResult(job: BatchComplianceJobV2) {
    let runningJob = job;
    while (runningJob.status !== 'complete') {
      if (runningJob.status === 'expired' || runningJob.status === 'failed') {
        throw new Error('Job failed to be completed.');
      }

      await new Promise(resolve => setTimeout(resolve, 3500));
      runningJob = (await this.complianceJob(job.id)).data;
    }

    // Download and parse result
    const result = await this.get<string>(job.download_url, undefined, {
      enableAuth: false,
      prefix: '',
    });

    return result
      .trim()
      .split('\n')
      .filter(line => line)
      .map(line => JSON.parse(line)) as BatchComplianceV2JobResult[];
  }
}
