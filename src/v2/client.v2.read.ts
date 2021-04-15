import TwitterApiSubClient from '../client.subclient';
import { API_V2_PREFIX } from '../globals';
import TweetPaginator from './TweetPaginator';
import {
  FollowersResult,
  FollowersV2Params,
  Tweetv2SearchParams,
  Tweetv2SearchResult,
  UserResult,
  UsersResult,
  UsersV2Params
} from './types.v2';

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
    return this.get<UserResult>(`users/${userId}`, options);
  }

  /**
   * Returns a variety of information about one or more users specified by the requested IDs.
   * https://developer.twitter.com/en/docs/twitter-api/users/lookup/api-reference/get-users
   */
  public users(userIds: string | string[], options: Partial<UsersV2Params> = {}) {
    const ids = Array.isArray(userIds) ? userIds.join(',') : userIds;
    return this.get<UsersResult>(`users`, { ...options, ids });
  }

  /**
   * Returns a variety of information about a single user specified by their username.
   * https://developer.twitter.com/en/docs/twitter-api/users/lookup/api-reference/get-users-by-username-username
   */
  public userByUsername(username: string, options: Partial<UsersV2Params> = {}) {
    return this.get<UserResult>(`users/by/username/${username}`, options);
  }

  /**
   * Returns a variety of information about one or more users specified by their usernames.
   * https://developer.twitter.com/en/docs/twitter-api/users/lookup/api-reference/get-users-by
   */
  public usersByUsernames(usernames: string | string[], options: Partial<UsersV2Params> = {}) {
    usernames = Array.isArray(usernames) ? usernames.join(',') : usernames;
    return this.get<UsersResult>(`users/by`, { ...options, usernames });
  }

  /**
   * Returns a list of users who are followers of the specified user ID.
   * https://developer.twitter.com/en/docs/twitter-api/users/follows/api-reference/get-users-id-followers
   */
  public followers(userId: string, options: Partial<FollowersV2Params> = {}) {
    return this.get<FollowersResult>(`users/${userId}/followers`, options);
  }

  /**
   * Returns a list of users the specified user ID is following.
   * https://developer.twitter.com/en/docs/twitter-api/users/follows/api-reference/get-users-id-following
   */
  public following(userId: string, options: Partial<FollowersV2Params> = {}) {
    return this.get<FollowersResult>(`users/${userId}/following`, options);
  }
}
