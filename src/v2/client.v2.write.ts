import { API_V2_PREFIX } from '../globals';
import TwitterApiv2ReadOnly from './client.v2.read';
import type {
  StreamingV2AddRulesParams,
  StreamingV2DeleteRulesParams,
  StreamingV2UpdateRulesAddResult,
  StreamingV2UpdateRulesDeleteResult,
  StreamingV2UpdateRulesParams,
  StreamingV2UpdateRulesQuery,
  StreamingV2UpdateRulesResult,
  TweetV2HideReplyResult,
  UserV2BlockResult,
  UserV2FollowResult,
  UserV2UnfollowResult
} from '../types';
import TwitterApiv2LabsReadWrite from '../v2-labs/client.v2.labs.write';

/**
 * Base Twitter v2 client with read/write rights.
 */
export default class TwitterApiv2ReadWrite extends TwitterApiv2ReadOnly {
  protected _prefix = API_V2_PREFIX;
  protected _labs?: TwitterApiv2LabsReadWrite;

  /* Sub-clients */

  /**
   * Get a client with only read rights.
   */
  public get readOnly() {
    return this as TwitterApiv2ReadOnly;
  }

  /**
   * Get a client for v2 labs endpoints.
   */
  public get labs() {
    if (this._labs) return this._labs;

    return this._labs = new TwitterApiv2LabsReadWrite(this);
  }

  /* Tweets */

  /**
   * Hides or unhides a reply to a Tweet.
   * https://developer.twitter.com/en/docs/twitter-api/tweets/hide-replies/api-reference/put-tweets-id-hidden
   */
  public hideReply(tweetId: string, makeHidden: boolean) {
    return this.put<TweetV2HideReplyResult>(`tweets/${tweetId}/hidden`, { hidden: makeHidden });
  }

  /* Users */

  /**
   * Allows a user ID to follow another user.
   * If the target user does not have public Tweets, this endpoint will send a follow request.
   * https://developer.twitter.com/en/docs/twitter-api/users/follows/api-reference/post-users-source_user_id-following
   *
   * **Note**: You must specify the currently logged user ID ; you can obtain it through v1.1 API.
   */
  public follow(loggedUserId: string, targetUserId: string) {
    return this.post<UserV2FollowResult>(`users/${loggedUserId}/following`, { target_user_id: targetUserId });
  }

  /**
   * Allows a user ID to unfollow another user.
   * https://developer.twitter.com/en/docs/twitter-api/users/follows/api-reference/delete-users-source_id-following
   *
   * **Note**: You must specify the currently logged user ID ; you can obtain it through v1.1 API.
   */
  public unfollow(loggedUserId: string, targetUserId: string) {
    return this.delete<UserV2UnfollowResult>(`users/${loggedUserId}/following/${targetUserId}`);
  }

  /**
   * Causes the user (in the path) to block the target user.
   * The user (in the path) must match the user context authorizing the request.
   * https://developer.twitter.com/en/docs/twitter-api/users/blocks/api-reference/post-users-user_id-blocking
   *
   * **Note**: You must specify the currently logged user ID ; you can obtain it through v1.1 API.
   */
  public block(loggedUserId: string, targetUserId: string) {
    return this.post<UserV2BlockResult>(`users/${loggedUserId}/blocking`, { target_user_id: targetUserId });
  }

  /**
   * Allows a user or authenticated user ID to unblock another user.
   * https://developer.twitter.com/en/docs/twitter-api/users/blocks/api-reference/delete-users-user_id-blocking
   *
   * **Note**: You must specify the currently logged user ID ; you can obtain it through v1.1 API.
   */
  public unblock(loggedUserId: string, targetUserId: string) {
    return this.delete<UserV2BlockResult>(`users/${loggedUserId}/blocking/${targetUserId}`);
  }

  /* Streaming API */

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
}
