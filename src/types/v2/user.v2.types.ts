// Users
import type { CashtagEntity, HashtagEntity, MentionEntity, UrlEntity } from '../entities.types';
import { TweetV2 } from './tweet.definition.v2';
import { DataAndIncludeV2, DataAndMetaV2, DataV2 } from './shared.v2.types';
import { TTweetv2TweetField, TTweetv2UserField } from './tweet.v2.types';
import { TypeOrArrayOf } from '../shared.types';

export type TUserV2Expansion = 'pinned_tweet_id';

// - Params -

export interface UsersV2Params {
  expansions: TypeOrArrayOf<TUserV2Expansion>;
  'tweet.fields': TypeOrArrayOf<TTweetv2TweetField>;
  'user.fields': TypeOrArrayOf<TTweetv2UserField>;
}

export interface FollowersV2Params {
  expansions: TypeOrArrayOf<TUserV2Expansion>;
  max_results: number;
  pagination_token: string;
  'tweet.fields': TypeOrArrayOf<TTweetv2TweetField>;
  'user.fields': TypeOrArrayOf<TTweetv2UserField>;
}

// - Results -

export type UserV2Result = DataAndIncludeV2<UserV2, { tweets?: TweetV2[] }>;
export type UsersV2Result = DataAndIncludeV2<UserV2[], { tweets?: TweetV2[] }>;

export type FollowersV2Result = DataAndMetaV2<UserV2[], {
  result_count: number;
  previous_token?: string;
  next_token?: string;
}>;

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
