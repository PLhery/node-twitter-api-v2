import type { ApiV2Includes, ListV2, SpaceV2, TweetV2, UserV2 } from '../types';

export type TTwitterV2IncludesResult = { includes?: ApiV2Includes };

/**
 * Provide helpers for `.includes` of a v2 API result.
 * Needed expansions for a method to work are specified (*`like this`*).
 */
export class TwitterV2IncludesHelper implements ApiV2Includes {
  constructor(protected result: TTwitterV2IncludesResult) {}

  /* Tweets */

  get tweets() {
    return TwitterV2IncludesHelper.tweets(this.result);
  }

  static tweets(result: TTwitterV2IncludesResult) {
    return result.includes?.tweets ?? [];
  }

  tweetById(id: string) {
    return TwitterV2IncludesHelper.tweetById(this.result, id);
  }

  static tweetById(result: TTwitterV2IncludesResult, id: string) {
    return this.tweets(result).find(tweet => tweet.id === id);
  }

  /** Retweet associated with the given tweet (*`referenced_tweets.id`*) */
  retweet(tweet: TweetV2) {
    return TwitterV2IncludesHelper.retweet(this.result, tweet);
  }

  /** Retweet associated with the given tweet (*`referenced_tweets.id`*) */
  static retweet(result: TTwitterV2IncludesResult, tweet: TweetV2) {
    const retweetIds = (tweet.referenced_tweets ?? [])
      .filter(ref => ref.type === 'retweeted')
      .map(ref => ref.id);

    return this.tweets(result).find(t => retweetIds.includes(t.id));
  }

  /** Quoted tweet associated with the given tweet (*`referenced_tweets.id`*) */
  quote(tweet: TweetV2) {
    return TwitterV2IncludesHelper.quote(this.result, tweet);
  }

  /** Quoted tweet associated with the given tweet (*`referenced_tweets.id`*) */
  static quote(result: TTwitterV2IncludesResult, tweet: TweetV2) {
    const quoteIds = (tweet.referenced_tweets ?? [])
      .filter(ref => ref.type === 'quoted')
      .map(ref => ref.id);

    return this.tweets(result).find(t => quoteIds.includes(t.id));
  }

  /** Tweet whose has been answered by the given tweet (*`referenced_tweets.id`*) */
  repliedTo(tweet: TweetV2) {
    return TwitterV2IncludesHelper.repliedTo(this.result, tweet);
  }

  /** Tweet whose has been answered by the given tweet (*`referenced_tweets.id`*) */
  static repliedTo(result: TTwitterV2IncludesResult, tweet: TweetV2) {
    const repliesIds = (tweet.referenced_tweets ?? [])
      .filter(ref => ref.type === 'replied_to')
      .map(ref => ref.id);

    return this.tweets(result).find(t => repliesIds.includes(t.id));
  }

  /** Tweet author user object of the given tweet (*`author_id`* or *`referenced_tweets.id.author_id`*) */
  author(tweet: TweetV2) {
    return TwitterV2IncludesHelper.author(this.result, tweet);
  }

  /** Tweet author user object of the given tweet (*`author_id`* or *`referenced_tweets.id.author_id`*) */
  static author(result: TTwitterV2IncludesResult, tweet: TweetV2) {
    const authorId = tweet.author_id;
    return authorId ? this.users(result).find(u => u.id === authorId) : undefined;
  }

  /** Tweet author user object of the tweet answered by the given tweet (*`in_reply_to_user_id`*) */
  repliedToAuthor(tweet: TweetV2) {
    return TwitterV2IncludesHelper.repliedToAuthor(this.result, tweet);
  }

  /** Tweet author user object of the tweet answered by the given tweet (*`in_reply_to_user_id`*) */
  static repliedToAuthor(result: TTwitterV2IncludesResult, tweet: TweetV2) {
    const inReplyUserId = tweet.in_reply_to_user_id;
    return inReplyUserId ? this.users(result).find(u => u.id === inReplyUserId) : undefined;
  }

  /* Users */

  get users() {
    return TwitterV2IncludesHelper.users(this.result);
  }

  static users(result: TTwitterV2IncludesResult) {
    return result.includes?.users ?? [];
  }

  userById(id: string) {
    return TwitterV2IncludesHelper.userById(this.result, id);
  }

  static userById(result: TTwitterV2IncludesResult, id: string) {
    return this.users(result).find(u => u.id === id);
  }

  /** Pinned tweet of the given user (*`pinned_tweet_id`*) */
  pinnedTweet(user: UserV2) {
    return TwitterV2IncludesHelper.pinnedTweet(this.result, user);
  }

  /** Pinned tweet of the given user (*`pinned_tweet_id`*) */
  static pinnedTweet(result: TTwitterV2IncludesResult, user: UserV2) {
    return user.pinned_tweet_id ? this.tweets(result).find(t => t.id === user.pinned_tweet_id) : undefined;
  }

  /* Medias */

  get media() {
    return TwitterV2IncludesHelper.media(this.result);
  }

  static media(result: TTwitterV2IncludesResult) {
    return result.includes?.media ?? [];
  }

  /** Medias associated with the given tweet (*`attachments.media_keys`*) */
  medias(tweet: TweetV2) {
    return TwitterV2IncludesHelper.medias(this.result, tweet);
  }

  /** Medias associated with the given tweet (*`attachments.media_keys`*) */
  static medias(result: TTwitterV2IncludesResult, tweet: TweetV2) {
    const keys = tweet.attachments?.media_keys ?? [];
    return this.media(result).filter(m => keys.includes(m.media_key));
  }

  /* Polls */

  get polls() {
    return TwitterV2IncludesHelper.polls(this.result);
  }

  static polls(result: TTwitterV2IncludesResult) {
    return result.includes?.polls ?? [];
  }

  /** Poll associated with the given tweet (*`attachments.poll_ids`*) */
  poll(tweet: TweetV2) {
    return TwitterV2IncludesHelper.poll(this.result, tweet);
  }

  /** Poll associated with the given tweet (*`attachments.poll_ids`*) */
  static poll(result: TTwitterV2IncludesResult, tweet: TweetV2) {
    const pollIds = tweet.attachments?.poll_ids ?? [];

    if (pollIds.length) {
      const pollId = pollIds[0];
      return this.polls(result).find(p => p.id === pollId);
    }
    return undefined;
  }

  /* Places */

  get places() {
    return TwitterV2IncludesHelper.places(this.result);
  }

  static places(result: TTwitterV2IncludesResult) {
    return result.includes?.places ?? [];
  }

  /** Place associated with the given tweet (*`geo.place_id`*) */
  place(tweet: TweetV2) {
    return TwitterV2IncludesHelper.place(this.result, tweet);
  }

  /** Place associated with the given tweet (*`geo.place_id`*) */
  static place(result: TTwitterV2IncludesResult, tweet: TweetV2) {
    const placeId = tweet.geo?.place_id;
    return placeId ? this.places(result).find(p => p.id === placeId) : undefined;
  }

  /* Lists */

  /** List owner of the given list (*`owner_id`*) */
  listOwner(list: ListV2) {
    return TwitterV2IncludesHelper.listOwner(this.result, list);
  }

  /** List owner of the given list (*`owner_id`*) */
  static listOwner(result: TTwitterV2IncludesResult, list: ListV2) {
    const creatorId = list.owner_id;
    return creatorId ? this.users(result).find(p => p.id === creatorId) : undefined;
  }

  /* Spaces */

  /** Creator of the given space (*`creator_id`*) */
  spaceCreator(space: SpaceV2) {
    return TwitterV2IncludesHelper.spaceCreator(this.result, space);
  }

  /** Creator of the given space (*`creator_id`*) */
  static spaceCreator(result: TTwitterV2IncludesResult, space: SpaceV2) {
    const creatorId = space.creator_id;
    return creatorId ? this.users(result).find(p => p.id === creatorId) : undefined;
  }

  /** Current hosts of the given space (*`host_ids`*) */
  spaceHosts(space: SpaceV2) {
    return TwitterV2IncludesHelper.spaceHosts(this.result, space);
  }

  /** Current hosts of the given space (*`host_ids`*) */
  static spaceHosts(result: TTwitterV2IncludesResult, space: SpaceV2) {
    const hostIds = space.host_ids ?? [];
    return this.users(result).filter(u => hostIds.includes(u.id));
  }

  /** Current speakers of the given space (*`speaker_ids`*) */
  spaceSpeakers(space: SpaceV2) {
    return TwitterV2IncludesHelper.spaceSpeakers(this.result, space);
  }

  /** Current speakers of the given space (*`speaker_ids`*) */
  static spaceSpeakers(result: TTwitterV2IncludesResult, space: SpaceV2) {
    const speakerIds = space.speaker_ids ?? [];
    return this.users(result).filter(u => speakerIds.includes(u.id));
  }

  /** Current invited users of the given space (*`invited_user_ids`*) */
  spaceInvitedUsers(space: SpaceV2) {
    return TwitterV2IncludesHelper.spaceInvitedUsers(this.result, space);
  }

  /** Current invited users of the given space (*`invited_user_ids`*) */
  static spaceInvitedUsers(result: TTwitterV2IncludesResult, space: SpaceV2) {
    const invitedUserIds = space.invited_user_ids ?? [];
    return this.users(result).filter(u => invitedUserIds.includes(u.id));
  }
}
