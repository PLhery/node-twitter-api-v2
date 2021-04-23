// Tweets
import type { TweetV2, ApiV2Includes } from './tweet.definition.v2';
import type { TypeOrArrayOf } from '../shared.types';
import type { DataAndIncludeV2, DataMetaAndIncludeV2, DataV2 } from './shared.v2.types';

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

export interface TweetV2PaginableTimelineParams extends TweetV2TimelineParams {
  pagination_token?: string;
}

export interface TweetV2UserTimelineParams extends TweetV2PaginableTimelineParams {
  exclude?: TypeOrArrayOf<'retweets' | 'replies'>;
}

export type TTweetv2Expansion = 'attachments.poll_ids' | 'attachments.media_keys'
  | 'author_id' | 'referenced_tweets.id' | 'in_reply_to_user_id'
  | 'geo.place_id' | 'entities.mentions.username' | 'referenced_tweets.id.author_id';
export type TTweetv2MediaField = 'duration_ms' | 'height' | 'media_key' | 'preview_image_url' | 'type'
  | 'url' | 'width' | 'public_metrics' | 'non_public_metrics' | 'organic_metrics';
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

export type Tweetv2TimelineResult = DataMetaAndIncludeV2<TweetV2[], {
  newest_id: string;
  oldest_id: string;
  result_count: number;
  next_token?: string;
}, ApiV2Includes>;

export type Tweetv2SearchResult = Tweetv2TimelineResult;
export type TweetV2UserTimelineResult = Tweetv2TimelineResult;

export type TweetV2LookupResult = DataAndIncludeV2<TweetV2[], ApiV2Includes>;
export type TweetV2SingleResult = DataAndIncludeV2<TweetV2, ApiV2Includes>;

/// -- Replies --

export type TweetV2HideReplyResult = DataV2<{ hidden: boolean }>;
