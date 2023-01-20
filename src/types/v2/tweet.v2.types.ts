// Tweets
import type { TweetV2, ApiV2Includes } from './tweet.definition.v2';
import type { TypeOrArrayOf } from '../shared.types';
import type { DataAndIncludeV2, DataAndMetaV2, DataMetaAndIncludeV2, DataV2, MetaV2 } from './shared.v2.types';
import { UserV2 } from './user.v2.types';
import { PaginableCountMetaV2 } from './shared.v2.types';

/// -- Timelines --

// - Timeline params -

export interface TweetV2TimelineParams extends Partial<Tweetv2FieldsParams> {
  /** ISO date string */
  end_time?: string;
  /** ISO date string */
  start_time?: string;
  max_results?: number;
  since_id?: string;
  until_id?: string;
  next_token?: string;
}

export interface Tweetv2SearchParams extends TweetV2TimelineParams {
  previous_token?: string;
  query: string;
  sort_order?: 'recency' | 'relevancy';
}

export interface TweetV2PaginableTimelineParams extends TweetV2TimelineParams {
  pagination_token?: string;
}

export interface TweetV2PaginableListParams extends Partial<Tweetv2FieldsParams> {
  pagination_token?: string;
  max_results?: number;
}

export interface TweetV2UserTimelineParams extends TweetV2PaginableTimelineParams {
  exclude?: TypeOrArrayOf<'retweets' | 'replies'>;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TweetV2HomeTimelineParams extends TweetV2UserTimelineParams {}

export type TTweetv2Expansion = 'attachments.poll_ids' | 'attachments.media_keys'
  | 'author_id' | 'referenced_tweets.id' | 'in_reply_to_user_id' | 'edit_history_tweet_ids'
  | 'geo.place_id' | 'entities.mentions.username' | 'referenced_tweets.id.author_id';
export type TTweetv2MediaField = 'duration_ms' | 'height' | 'media_key' | 'preview_image_url' | 'type'
  | 'url' | 'width' | 'public_metrics' | 'non_public_metrics' | 'organic_metrics' | 'alt_text' | 'variants';
export type TTweetv2PlaceField = 'contained_within' | 'country' | 'country_code' | 'full_name' | 'geo' | 'id' | 'name' | 'place_type';
export type TTweetv2PollField = 'duration_minutes' | 'end_datetime' | 'id' | 'options' | 'voting_status';
export type TTweetv2TweetField = 'attachments' | 'author_id' | 'context_annotations' | 'conversation_id'
  | 'created_at' | 'entities' | 'geo' | 'id' | 'in_reply_to_user_id' | 'lang'
  | 'public_metrics' | 'non_public_metrics' | 'promoted_metrics' | 'organic_metrics' | 'edit_controls'
  | 'possibly_sensitive' | 'referenced_tweets' | 'reply_settings' | 'source' | 'text' | 'withheld';
export type TTweetv2UserField = 'created_at' | 'description' | 'entities' | 'id' | 'location'
  | 'name' | 'pinned_tweet_id' | 'profile_image_url' | 'protected' | 'public_metrics'
  | 'url' | 'username' | 'verified' | 'verified_type' | 'withheld';

export interface Tweetv2FieldsParams {
  expansions: TypeOrArrayOf<TTweetv2Expansion> | string;
  'media.fields': TypeOrArrayOf<TTweetv2MediaField> | string;
  'place.fields': TypeOrArrayOf<TTweetv2PlaceField> | string;
  'poll.fields': TypeOrArrayOf<TTweetv2PollField> | string;
  'tweet.fields': TypeOrArrayOf<TTweetv2TweetField> | string;
  'user.fields': TypeOrArrayOf<TTweetv2UserField> | string;
}

// - Tweet stream -

export interface TweetSearchV2StreamParams extends Tweetv2FieldsParams {
  backfill_minutes: number;
}

// - Tweet count -

export interface TweetV2CountParams {
  query: string;
  end_time?: string;
  start_time?: string;
  until_id?: string;
  since_id?: string;
  granularity?: 'day' | 'hour' | 'minute';
}

export interface TweetV2CountAllParams extends TweetV2CountParams {
  next_token: string;
}

export type TweetV2CountResult = DataAndMetaV2<{
  start: string;
  end: string;
  tweet_count: number;
}[], {
  total_tweet_count: number;
}>;

export type TweetV2CountAllResult = TweetV2CountResult & MetaV2<{ next_token: string }>;

// - Timeline results -

export type Tweetv2TimelineResult = DataMetaAndIncludeV2<TweetV2[], {
  newest_id: string;
  oldest_id: string;
  result_count: number;
  next_token?: string;
}, ApiV2Includes>;

export type Tweetv2ListResult = DataMetaAndIncludeV2<TweetV2[], PaginableCountMetaV2, ApiV2Includes>;

export type Tweetv2SearchResult = Tweetv2TimelineResult;
export type TweetV2PaginableTimelineResult = Tweetv2TimelineResult & MetaV2<{ previous_token?: string }>;
export type TweetV2UserTimelineResult = TweetV2PaginableTimelineResult;
export type TweetV2HomeTimelineResult = TweetV2PaginableTimelineResult;

export type TweetV2LookupResult = DataAndIncludeV2<TweetV2[], ApiV2Includes>;
export type TweetV2SingleResult = DataAndIncludeV2<TweetV2, ApiV2Includes>;
export type TweetV2SingleStreamResult = TweetV2SingleResult & {
  matching_rules: { id: string | number, tag: string }[];
};

/// Tweet

export type TweetV2PostTweetResult = DataV2<{ id: string, text: string }>;

/// -- Replies --

export type TweetV2HideReplyResult = DataV2<{ hidden: boolean }>;

/// -- Likes

export type TweetV2LikeResult = DataV2<{
  liked: boolean;
}>;

export type TweetV2LikedByResult = DataMetaAndIncludeV2<UserV2[], PaginableCountMetaV2, ApiV2Includes>;

/// -- Retweets

export type TweetV2RetweetResult = DataV2<{ retweeted: boolean }>;

export type TweetV2RetweetedByResult = TweetV2LikedByResult;

// -- Bookmarks

export type TweetV2BookmarkResult = DataV2<{ bookmarked: boolean }>;

/// Tweets

export type TweetV2DeleteTweetResult = DataV2<{ deleted: boolean }>;

/// -- Batch compliance

export interface BatchComplianceJobV2 {
  resumable: false;
  type: 'tweets' | 'users';
  download_expires_at: string;
  created_at: string;
  upload_url: string;
  download_url: string;
  id: string;
  status: 'created' | 'complete' | 'in_progress' | 'expired' | 'failed';
  upload_expires_at: string;
  error?: string;
}

export interface BatchComplianceSearchV2Params {
  type: 'tweets' | 'users';
  status?: 'created' | 'complete' | 'in_progress' | 'expired' | 'failed';
}

export interface BatchComplianceV2Params {
  type: 'tweets' | 'users';
  name?: string;
  ids: string[] | Buffer;
}

export interface BatchComplianceV2JobResult {
  id: string;
  action: 'delete';
  created_at: string;
  redacted_at?: string;
  reason: 'deleted' | 'suspended' | 'protected' | 'scrub_geo' | 'deactivated';
}

export type BatchComplianceListV2Result = DataV2<BatchComplianceJobV2[]>;

export type BatchComplianceV2Result = DataV2<BatchComplianceJobV2>;
