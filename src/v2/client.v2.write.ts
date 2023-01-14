import { API_V2_PREFIX } from '../globals';
import TwitterApiv2ReadOnly from './client.v2.read';
import type {
  ListCreateV2Params,
  ListCreateV2Result,
  ListDeleteV2Result,
  ListFollowV2Result,
  ListMemberV2Result,
  ListPinV2Result,
  ListUpdateV2Params,
  ListUpdateV2Result,
  TweetV2DeleteTweetResult,
  SendTweetV2Params,
  TweetV2HideReplyResult,
  TweetV2LikeResult,
  TweetV2PostTweetResult,
  TweetV2RetweetResult,
  UserV2BlockResult,
  UserV2FollowResult,
  UserV2MuteResult,
  UserV2UnfollowResult,
  TweetV2BookmarkResult,
} from '../types';
import TwitterApiv2LabsReadWrite from '../v2-labs/client.v2.labs.write';
import { CreateDMConversationParams, PostDMInConversationParams, PostDMInConversationResult } from '../types/v2/dm.v2.types';

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
    return this.put<TweetV2HideReplyResult>('tweets/:id/hidden', { hidden: makeHidden }, { params: { id: tweetId } });
  }

  /**
   * Causes the user ID identified in the path parameter to Like the target Tweet.
   * https://developer.twitter.com/en/docs/twitter-api/tweets/likes/api-reference/post-users-user_id-likes
   *
   * **Note**: You must specify the currently logged user ID ; you can obtain it through v1.1 API.
   */
  public like(loggedUserId: string, targetTweetId: string) {
    return this.post<TweetV2LikeResult>('users/:id/likes', { tweet_id: targetTweetId }, { params: { id: loggedUserId } });
  }

  /**
   * Allows a user or authenticated user ID to unlike a Tweet.
   * The request succeeds with no action when the user sends a request to a user they're not liking the Tweet or have already unliked the Tweet.
   * https://developer.twitter.com/en/docs/twitter-api/tweets/likes/api-reference/delete-users-id-likes-tweet_id
   *
   * **Note**: You must specify the currently logged user ID ; you can obtain it through v1.1 API.
   */
  public unlike(loggedUserId: string, targetTweetId: string) {
    return this.delete<TweetV2LikeResult>('users/:id/likes/:tweet_id', undefined, {
      params: { id: loggedUserId, tweet_id: targetTweetId },
    });
  }

  /**
   * Causes the user ID identified in the path parameter to Retweet the target Tweet.
   * https://developer.twitter.com/en/docs/twitter-api/tweets/retweets/api-reference/post-users-id-retweets
   *
   * **Note**: You must specify the currently logged user ID ; you can obtain it through v1.1 API.
   */
  public retweet(loggedUserId: string, targetTweetId: string) {
    return this.post<TweetV2RetweetResult>('users/:id/retweets', { tweet_id: targetTweetId }, { params: { id: loggedUserId } });
  }

  /**
   * Allows a user or authenticated user ID to remove the Retweet of a Tweet.
   * The request succeeds with no action when the user sends a request to a user they're not Retweeting the Tweet or have already removed the Retweet of.
   * https://developer.twitter.com/en/docs/twitter-api/tweets/retweets/api-reference/delete-users-id-retweets-tweet_id
   *
   * **Note**: You must specify the currently logged user ID ; you can obtain it through v1.1 API.
   */
  public unretweet(loggedUserId: string, targetTweetId: string) {
    return this.delete<TweetV2RetweetResult>('users/:id/retweets/:tweet_id', undefined, {
      params: { id: loggedUserId, tweet_id: targetTweetId },
    });
  }

  /**
   * Creates a Tweet on behalf of an authenticated user.
   * https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/api-reference/post-tweets
   */
  public tweet(status: string, payload?: Partial<SendTweetV2Params>): Promise<TweetV2PostTweetResult>;
  public tweet(payload: SendTweetV2Params): Promise<TweetV2PostTweetResult>;
  public tweet(status: string | SendTweetV2Params, payload: Partial<SendTweetV2Params> = {}) {
    if (typeof status === 'object') {
      payload = status;
    } else {
      payload = { text: status, ...payload };
    }

    return this.post<TweetV2PostTweetResult>('tweets', payload);
  }

  /**
   * Reply to a Tweet on behalf of an authenticated user.
   * https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/api-reference/post-tweets
   */
  public reply(status: string, toTweetId: string, payload: Partial<SendTweetV2Params> = {}) {
    const reply = { in_reply_to_tweet_id: toTweetId, ...payload.reply ?? {} };

    return this.post<TweetV2PostTweetResult>('tweets', { text: status, ...payload, reply });
  }

  /**
   * Quote an existing Tweet on behalf of an authenticated user.
   * https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/api-reference/post-tweets
   */
  public quote(status: string, quotedTweetId: string, payload: Partial<SendTweetV2Params> = {}) {
    return this.tweet(status, { ...payload, quote_tweet_id: quotedTweetId });
  }

  /**
   * Post a series of tweets.
   * https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/api-reference/post-tweets
   */
  public async tweetThread(tweets: (SendTweetV2Params | string)[]) {
    const postedTweets: TweetV2PostTweetResult[] = [];

    for (const tweet of tweets) {
      // Retrieve the last sent tweet
      const lastTweet = postedTweets.length ? postedTweets[postedTweets.length - 1] : null;
      // Build the tweet query params
      const queryParams: SendTweetV2Params = { ...(typeof tweet === 'string' ? ({ text: tweet }) : tweet) };
      // Reply to an existing tweet if needed
      const inReplyToId = lastTweet ? lastTweet.data.id : queryParams.reply?.in_reply_to_tweet_id;
      const status = queryParams.text ?? '';

      if (inReplyToId) {
        postedTweets.push(await this.reply(status, inReplyToId, queryParams));
      } else {
        postedTweets.push(await this.tweet(status, queryParams));
      }
    }

    return postedTweets;
  }

  /**
   * Allows a user or authenticated user ID to delete a Tweet
   * https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/api-reference/delete-tweets-id
   */
  public deleteTweet(tweetId: string) {
    return this.delete<TweetV2DeleteTweetResult>('tweets/:id', undefined, {
      params: {
        id: tweetId,
      },
    });
  }

  /* Bookmarks */

  /**
   * Causes the user ID of an authenticated user identified in the path parameter to Bookmark the target Tweet provided in the request body.
   * https://developer.twitter.com/en/docs/twitter-api/tweets/bookmarks/api-reference/post-users-id-bookmarks
   *
   * OAuth2 scopes: `users.read` `tweet.read` `bookmark.write`
   */
  public async bookmark(tweetId: string) {
    const user = await this.getCurrentUserV2Object();
    return this.post<TweetV2BookmarkResult>('users/:id/bookmarks', { tweet_id: tweetId }, { params: { id: user.data.id } });
  }

  /**
   * Allows a user or authenticated user ID to remove a Bookmark of a Tweet.
   * https://developer.twitter.com/en/docs/twitter-api/tweets/bookmarks/api-reference/delete-users-id-bookmarks-tweet_id
   *
   * OAuth2 scopes: `users.read` `tweet.read` `bookmark.write`
   */
  public async deleteBookmark(tweetId: string) {
    const user = await this.getCurrentUserV2Object();
    return this.delete<TweetV2BookmarkResult>('users/:id/bookmarks/:tweet_id', undefined, { params: { id: user.data.id, tweet_id: tweetId } });
  }

  /* Users */

  /**
   * Allows a user ID to follow another user.
   * If the target user does not have public Tweets, this endpoint will send a follow request.
   * https://developer.twitter.com/en/docs/twitter-api/users/follows/api-reference/post-users-source_user_id-following
   *
   * OAuth2 scope: `follows.write`
   *
   * **Note**: You must specify the currently logged user ID ; you can obtain it through v1.1 API.
   */
  public follow(loggedUserId: string, targetUserId: string) {
    return this.post<UserV2FollowResult>('users/:id/following', { target_user_id: targetUserId }, { params: { id: loggedUserId } });
  }

  /**
   * Allows a user ID to unfollow another user.
   * https://developer.twitter.com/en/docs/twitter-api/users/follows/api-reference/delete-users-source_id-following
   *
   * OAuth2 scope: `follows.write`
   *
   * **Note**: You must specify the currently logged user ID ; you can obtain it through v1.1 API.
   */
  public unfollow(loggedUserId: string, targetUserId: string) {
    return this.delete<UserV2UnfollowResult>('users/:source_user_id/following/:target_user_id', undefined, {
      params: { source_user_id: loggedUserId, target_user_id: targetUserId },
    });
  }

  /**
   * Causes the user (in the path) to block the target user.
   * The user (in the path) must match the user context authorizing the request.
   * https://developer.twitter.com/en/docs/twitter-api/users/blocks/api-reference/post-users-user_id-blocking
   *
   * **Note**: You must specify the currently logged user ID ; you can obtain it through v1.1 API.
   */
  public block(loggedUserId: string, targetUserId: string) {
    return this.post<UserV2BlockResult>('users/:id/blocking', { target_user_id: targetUserId }, { params: { id: loggedUserId } });
  }

  /**
   * Allows a user or authenticated user ID to unblock another user.
   * https://developer.twitter.com/en/docs/twitter-api/users/blocks/api-reference/delete-users-user_id-blocking
   *
   * **Note**: You must specify the currently logged user ID ; you can obtain it through v1.1 API.
   */
  public unblock(loggedUserId: string, targetUserId: string) {
    return this.delete<UserV2BlockResult>('users/:source_user_id/blocking/:target_user_id', undefined, {
      params: { source_user_id: loggedUserId, target_user_id: targetUserId },
    });
  }

  /**
   * Allows an authenticated user ID to mute the target user.
   * https://developer.twitter.com/en/docs/twitter-api/users/mutes/api-reference/post-users-user_id-muting
   *
   * **Note**: You must specify the currently logged user ID ; you can obtain it through v1.1 API.
   */
  public mute(loggedUserId: string, targetUserId: string) {
    return this.post<UserV2MuteResult>('users/:id/muting', { target_user_id: targetUserId }, { params: { id: loggedUserId } });
  }

  /**
   * Allows an authenticated user ID to unmute the target user.
   * The request succeeds with no action when the user sends a request to a user they're not muting or have already unmuted.
   * https://developer.twitter.com/en/docs/twitter-api/users/mutes/api-reference/delete-users-user_id-muting
   *
   * **Note**: You must specify the currently logged user ID ; you can obtain it through v1.1 API.
   */
  public unmute(loggedUserId: string, targetUserId: string) {
    return this.delete<UserV2MuteResult>('users/:source_user_id/muting/:target_user_id', undefined, {
      params: { source_user_id: loggedUserId, target_user_id: targetUserId },
    });
  }

  /* Lists */

  /**
   * Creates a new list for the authenticated user.
   * https://developer.twitter.com/en/docs/twitter-api/lists/manage-lists/api-reference/post-lists
   */
  public createList(options: ListCreateV2Params) {
    return this.post<ListCreateV2Result>('lists', options);
  }

  /**
   * Updates the specified list. The authenticated user must own the list to be able to update it.
   * https://developer.twitter.com/en/docs/twitter-api/lists/manage-lists/api-reference/put-lists-id
   */
  public updateList(listId: string, options: ListUpdateV2Params = {}) {
    return this.put<ListUpdateV2Result>('lists/:id', options, { params: { id: listId } });
  }

  /**
   * Deletes the specified list. The authenticated user must own the list to be able to destroy it.
   * https://developer.twitter.com/en/docs/twitter-api/lists/manage-lists/api-reference/delete-lists-id
   */
  public removeList(listId: string) {
    return this.delete<ListDeleteV2Result>('lists/:id', undefined, { params: { id: listId } });
  }

  /**
   * Adds a member to a list.
   * https://developer.twitter.com/en/docs/twitter-api/lists/manage-lists/api-reference/post-lists-id-members
   */
  public addListMember(listId: string, userId: string) {
    return this.post<ListMemberV2Result>('lists/:id/members', { user_id: userId }, { params: { id: listId } });
  }

  /**
   * Remember a member to a list.
   * https://developer.twitter.com/en/docs/twitter-api/lists/manage-lists/api-reference/delete-lists-id-members-user_id
   */
  public removeListMember(listId: string, userId: string) {
    return this.delete<ListMemberV2Result>('lists/:id/members/:user_id', undefined, { params: { id: listId, user_id: userId } });
  }

  /**
   * Subscribes the authenticated user to the specified list.
   * https://developer.twitter.com/en/docs/twitter-api/lists/manage-lists/api-reference/post-users-id-followed-lists
   */
  public subscribeToList(loggedUserId: string, listId: string) {
    return this.post<ListFollowV2Result>('users/:id/followed_lists', { list_id: listId }, { params: { id: loggedUserId } });
  }

  /**
   * Unsubscribes the authenticated user to the specified list.
   * https://developer.twitter.com/en/docs/twitter-api/lists/manage-lists/api-reference/delete-users-id-followed-lists-list_id
   */
  public unsubscribeOfList(loggedUserId: string, listId: string) {
    return this.delete<ListFollowV2Result>('users/:id/followed_lists/:list_id', undefined, { params: { id: loggedUserId, list_id: listId } });
  }

  /**
   * Enables the authenticated user to pin a List.
   * https://developer.twitter.com/en/docs/twitter-api/lists/manage-lists/api-reference/post-users-id-pinned-lists
   */
  public pinList(loggedUserId: string, listId: string) {
    return this.post<ListPinV2Result>('users/:id/pinned_lists', { list_id: listId }, { params: { id: loggedUserId } });
  }

  /**
   * Enables the authenticated user to unpin a List.
   * https://developer.twitter.com/en/docs/twitter-api/lists/manage-lists/api-reference/delete-users-id-pinned-lists-list_id
   */
  public unpinList(loggedUserId: string, listId: string) {
    return this.delete<ListPinV2Result>('users/:id/pinned_lists/:list_id', undefined, { params: { id: loggedUserId, list_id: listId } });
  }

  /* Direct messages */

  /**
   * Creates a Direct Message on behalf of an authenticated user, and adds it to the specified conversation.
   * https://developer.twitter.com/en/docs/twitter-api/direct-messages/manage/api-reference/post-dm_conversations-dm_conversation_id-messages
   */
  public sendDmInConversation(conversationId: string, message: PostDMInConversationParams) {
    return this.post<PostDMInConversationResult>('dm_conversations/:dm_conversation_id/messages', message, { params: { dm_conversation_id: conversationId } });
  }

  /**
   * Creates a one-to-one Direct Message and adds it to the one-to-one conversation.
   * This method either creates a new one-to-one conversation or retrieves the current conversation and adds the Direct Message to it.
   * https://developer.twitter.com/en/docs/twitter-api/direct-messages/manage/api-reference/post-dm_conversations-with-participant_id-messages
   */
  public sendDmToParticipant(participantId: string, message: PostDMInConversationParams) {
    return this.post<PostDMInConversationResult>('dm_conversations/with/:participant_id/messages', message, { params: { participant_id: participantId } });
  }

  /**
   * Creates a new group conversation and adds a Direct Message to it on behalf of an authenticated user.
   * https://developer.twitter.com/en/docs/twitter-api/direct-messages/manage/api-reference/post-dm_conversations
   */
  public createDmConversation(options: CreateDMConversationParams) {
    return this.post<PostDMInConversationResult>('dm_conversations', options);
  }
}
