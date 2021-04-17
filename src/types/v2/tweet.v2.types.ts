// Tweets
import { TweetV2, TweetV2Includes } from './tweet.definition.v2';
import { TypeOrArrayOf } from '../shared.types';

/// -- Timelines --

// - Timeline params -

export interface TweetV2TimelineParams extends Partial<Tweetv2FieldsParams> {
  /** ISO date string */
  end_time?: string;
  /** ISO date string */
  start_time?: string;
  max_results?: number | string;
  since_id?: string;
  until_id?: string;
}

export interface Tweetv2SearchParams extends TweetV2TimelineParams {
  next_token?: string;
  previous_token?: string;
  query: string;
}

export interface TweetV2UserTimelineParams extends TweetV2TimelineParams {
  exclude?: 'retweets' | 'replies';
  pagination_token?: string;
}

export interface TweetV2LookupParams extends Partial<Tweetv2FieldsParams> {
  ids: string;
}

export type TTweetv2Expansion = 'attachments.poll_ids' | 'attachments.media_keys'
  | 'author_id' | 'referenced_tweets.id' | 'in_reply_to_user_id'
  | 'geo.place_id' | 'entities.mentions.username' | 'referenced_tweets.id.author_id';
export type TTweetv2MediaField = 'duration_ms' | 'height' | 'media_key' | 'preview_image_url' | 'type' | 'url' | 'width' | 'public_metrics';
export type TTweetv2PlaceField = 'contained_within' | 'country' | 'country_code' | 'full_name' | 'geo' | 'id' | 'name' | 'place_type';
export type TTweetv2PollField = 'duration_minutes' | 'end_datetime' | 'id' | 'options' | 'voting_status';
export type TTweetv2TweetField = 'attachments' | 'author_id' | 'context_annotations' | 'conversation_id'
  | 'created_at' | 'entities' | 'geo' | 'id' | 'in_reply_to_user_id' | 'lang' | 'public_metrics'
  | 'possibly_sensitive' | 'referenced_tweets' | 'reply_settings' | 'source' | 'text' | 'withheld';
export type TTweetv2UserField = 'created_at' | 'description' | 'entities' | 'id' | 'location'
  | 'name' | 'pinned_tweet_id' | 'profile_image_url' | 'protected' | 'public_metrics'
  | 'url' | 'username' | 'verified' | 'withheld';

export interface Tweetv2FieldsParams {
  expansions: TypeOrArrayOf<TTweetv2Expansion> | string;
  'media.fields': TypeOrArrayOf<TTweetv2MediaField> | string;
  'place.fields': TypeOrArrayOf<TTweetv2PlaceField> | string;
  'poll.fields': TypeOrArrayOf<TTweetv2PollField> | string;
  'tweet.fields': TypeOrArrayOf<TTweetv2TweetField> | string;
  'user.fields': TypeOrArrayOf<TTweetv2UserField> | string;
}

// - Timeline results -

export interface Tweetv2TimelineResult {
  data: TweetV2[];
  includes?: TweetV2Includes;
  meta: {
    newest_id: string;
    oldest_id: string;
    result_count: number;
    next_token?: string;
  };
}

export interface Tweetv2SearchResult extends Tweetv2TimelineResult {}
export interface TweetV2UserTimelineResult extends Tweetv2TimelineResult {}

export interface TweetV2LookupResult {
  data: TweetV2[];
  includes?: TweetV2Includes;
}

/// -- Replies --

export interface TweetV2HideReplyResult {
  data: { hidden: boolean };
}
