import TwitterApiSubClient from '../client.subclient';
import { API_V2_PREFIX } from '../globals';
import TweetPaginator from './TweetPaginator';
import {Tweetv2SearchParams, Tweetv2SearchResult, User, UserResult, UsersResult, UsersV2Params} from './types.v2';

/**
 * Base Twitter v2 client with only read right.
 */
export default class TwitterApiv2ReadOnly extends TwitterApiSubClient {
  protected _prefix = API_V2_PREFIX;

  public async search(query: string, options: Partial<Tweetv2SearchParams> = {}) {
    const queryParams = {...options, query};
    const initialRq = await this.get<Tweetv2SearchResult>('tweets/search/recent', queryParams,true);

    return new TweetPaginator(initialRq.data, initialRq.rateLimit!, this, queryParams);
  }

  public user(userId: string, options: Partial<UsersV2Params> = {}) {
    return this.get<UserResult>(`users/${userId}`, options);
  }

  public users(userIds: string | string[], options: Partial<UsersV2Params> = {}) {
    const ids = Array.isArray(userIds) ? userIds.join(',') : userIds;
    return this.get<UsersResult>(`users`, {...options, ids});
  }

  public userByUsername(username: string, options: Partial<UsersV2Params> = {}) {
    return this.get<UserResult>(`users/by/username/${username}`, options);
  }

  public usersByUsernames(usernames: string | string[], options: Partial<UsersV2Params> = {}) {
    usernames = Array.isArray(usernames) ? usernames.join(',') : usernames;
    return this.get<UsersResult>(`users/by`, {...options, usernames});
  }
}
