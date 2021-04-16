// Users
import type { CashtagEntity, HashtagEntity, MentionEntity, UrlEntity } from '../entities.types';
import { TweetV2 } from './tweet.definition.v2';
import { DataAndIncludeV2, DataAndMetaV2, DataV2 } from './shared.v2.types';

// - Params -

export interface UsersV2Params {
  expansions: 'pinned_tweet_id';
  'tweet.fields': string;
  'user.fields': string;
}

export interface FollowersV2Params {
  expansions: 'pinned_tweet_id';
  max_results: number;
  pagination_token: string;
  'tweet.fields': string;
  'user.fields': string;
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
