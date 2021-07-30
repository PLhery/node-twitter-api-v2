// Users
import type { CashtagEntity, HashtagEntity, MentionEntity, UrlEntity } from '../entities.types';
import type { ApiV2Includes } from './tweet.definition.v2';
import type { DataAndIncludeV2, DataMetaAndIncludeV2, DataV2 } from './shared.v2.types';
import type { TTweetv2MediaField, TTweetv2PlaceField, TTweetv2PollField, TTweetv2TweetField, TTweetv2UserField } from './tweet.v2.types';
import type { TypeOrArrayOf } from '../shared.types';

export type TUserV2Expansion = 'pinned_tweet_id';

// - Params -

export interface UsersV2Params {
  expansions: TypeOrArrayOf<TUserV2Expansion>;
  'media.fields': TypeOrArrayOf<TTweetv2MediaField> | string;
  'place.fields': TypeOrArrayOf<TTweetv2PlaceField> | string;
  'poll.fields': TypeOrArrayOf<TTweetv2PollField> | string;
  'tweet.fields': TypeOrArrayOf<TTweetv2TweetField> | string;
  'user.fields': TypeOrArrayOf<TTweetv2UserField> | string;
}

export interface UserV2TimelineParams {
  expansions?: TypeOrArrayOf<TUserV2Expansion>;
  'media.fields'?: TypeOrArrayOf<TTweetv2MediaField> | string;
  'place.fields'?: TypeOrArrayOf<TTweetv2PlaceField> | string;
  'poll.fields'?: TypeOrArrayOf<TTweetv2PollField> | string;
  'tweet.fields'?: TypeOrArrayOf<TTweetv2TweetField> | string;
  'user.fields'?: TypeOrArrayOf<TTweetv2UserField> | string;
  max_results?: number;
  pagination_token?: string;
}

export interface FollowersV2Params {
  expansions: TypeOrArrayOf<TUserV2Expansion>;
  max_results: number;
  pagination_token: string;
  'tweet.fields': TypeOrArrayOf<TTweetv2TweetField>;
  'user.fields': TypeOrArrayOf<TTweetv2UserField>;
}

// - Results -

export type UserV2Result = DataAndIncludeV2<UserV2, ApiV2Includes>;
export type UsersV2Result = DataAndIncludeV2<UserV2[], ApiV2Includes>;

export type FollowersV2Result = DataMetaAndIncludeV2<UserV2[], {
  result_count: number;
  previous_token?: string;
  next_token?: string;
}, ApiV2Includes>;

export type UserV2FollowResult = DataV2<{
  following: boolean;
  pending_follow: boolean;
}>;

export type UserV2UnfollowResult = DataV2<{
  following: boolean;
}>;

export type UserV2BlockResult = DataV2<{
  blocking: boolean;
}>;

export type UserV2TimelineResult = DataMetaAndIncludeV2<UserV2[], {
  result_count: number;
  previous_token?: string;
  next_token?: string;
}, ApiV2Includes>;

// - Entities -

export interface UserV2 {
  id: string;
  name: string;
  username: string;
  created_at?: string; // ISO 8601 date
  protected?: boolean;
  withheld?: {
    country_codes?: string[];
    scope?: 'user';
  }
  location?: string;
  url?: string;
  description?: string;
  verified?: boolean;
  entities?: {
    url?: { urls: UrlEntity[] };
    description: {
      urls?: UrlEntity[];
      hashtags?: HashtagEntity[];
      cashtags?: CashtagEntity[];
      mentions?: MentionEntity[];
    }
  }
  profile_image_url?: string;
  public_metrics?: {
    followers_count?: number;
    following_count?: number;
    tweet_count?: number;
    listed_count?: number;
  },
  pinned_tweet_id?: string;
}
