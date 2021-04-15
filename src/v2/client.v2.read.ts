import TwitterApiSubClient from '../client.subclient';
import { API_V2_PREFIX } from '../globals';
import TweetPaginator from './TweetPaginator';
import type {
  FollowersV2Result,
  FollowersV2Params,
  Tweetv2FieldsParams,
  Tweetv2SearchParams,
  Tweetv2SearchResult,
  UserV2Result,
  UsersV2Result,
  UsersV2Params,
  StreamingV2GetRulesParams,
  StreamingV2GetRulesResult,
} from '../types';

/**
 * Base Twitter v2 client with only read right.
 */
export default class TwitterApiv2ReadOnly extends TwitterApiSubClient {
  protected _prefix = API_V2_PREFIX;

  public async search(query: string, options: Partial<Tweetv2SearchParams> = {}) {
    const queryParams = {...options, query};
    const initialRq = await this.get<Tweetv2SearchResult>('tweets/search/recent', queryParams, { fullResponse: true });

    return new TweetPaginator(initialRq.data, initialRq.rateLimit!, this, queryParams);
  }

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
    return this.getStream('tweets/search/stream', options);
  }

  /**
   * Return a list of rules currently active on the streaming endpoint, either as a list or individually.
   * https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/api-reference/get-tweets-search-stream-rules
   */
  public streamRules(options: Partial<StreamingV2GetRulesParams> = {}) {
    return this.get<StreamingV2GetRulesResult>('tweets/search/stream/rules', options);
  }

  /**
   * Streams about 1% of all Tweets in real-time.
   * https://developer.twitter.com/en/docs/twitter-api/tweets/sampled-stream/api-reference/get-tweets-sample-stream
   */
  public sampleStream(options: Partial<Tweetv2FieldsParams> = {}) {
    return this.getStream('tweets/sample/stream', options);
  }
}
