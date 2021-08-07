import { API_V2_PREFIX } from '../globals';
import TwitterApiv2ReadOnly from './client.v2.read';
import type {
  TweetV2HideReplyResult,
  TweetV2LikeResult,
  TweetV2RetweetResult,
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

  /**
   * Causes the user ID identified in the path parameter to Like the target Tweet.
   * https://developer.twitter.com/en/docs/twitter-api/tweets/likes/api-reference/post-users-user_id-likes
   *
   * **Note**: You must specify the currently logged user ID ; you can obtain it through v1.1 API.
   */
   public like(loggedUserId: string, targetTweetId: string) {
    return this.post<TweetV2LikeResult>(`users/${loggedUserId}/likes`, { tweet_id: targetTweetId });
  }

  /**
   * Allows a user or authenticated user ID to unlike a Tweet.
   * The request succeeds with no action when the user sends a request to a user they're not liking the Tweet or have already unliked the Tweet.
   * https://developer.twitter.com/en/docs/twitter-api/tweets/likes/api-reference/delete-users-user_id-likes
   *
   * **Note**: You must specify the currently logged user ID ; you can obtain it through v1.1 API.
   */
  public unlike(loggedUserId: string, targetTweetId: string) {
    return this.delete<TweetV2LikeResult>(`users/${loggedUserId}/likes/${targetTweetId}`);
  }

  /**
   * Causes the user ID identified in the path parameter to Retweet the target Tweet.
   * https://developer.twitter.com/en/docs/twitter-api/tweets/retweets/api-reference/post-users-id-retweets
   *
   * **Note**: You must specify the currently logged user ID ; you can obtain it through v1.1 API.
   */
  public retweet(loggedUserId: string, targetTweetId: string) {
    return this.post<TweetV2RetweetResult>(`users/${loggedUserId}/retweets`, { tweet_id: targetTweetId });
  }

  /**
   * Allows a user or authenticated user ID to remove the Retweet of a Tweet.
   * The request succeeds with no action when the user sends a request to a user they're not Retweeting the Tweet or have already removed the Retweet of.
   * https://developer.twitter.com/en/docs/twitter-api/tweets/retweets/api-reference/delete-users-id-retweets-tweet_id
   *
   * **Note**: You must specify the currently logged user ID ; you can obtain it through v1.1 API.
   */
  public unretweet(loggedUserId: string, targetTweetId: string) {
    return this.delete<TweetV2RetweetResult>(`users/${loggedUserId}/retweets/${targetTweetId}`);
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
}
