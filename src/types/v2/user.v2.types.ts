// Users
import type { CashtagEntity, HashtagEntity, MentionEntity, UrlEntity } from '../entities.types';
import type { TweetV2 } from './tweet.v2.types';

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

export interface UserV2Result {
  data: UserV2;
  includes?: {
    tweets: TweetV2[]; // pinned tweet
  }
}

export interface UsersV2Result {
  data: UserV2[]
  includes?: {
    tweets: TweetV2[]; // pinned tweets
  }
}

export interface FollowersV2Result {
  data: UserV2[];
  meta: {
    result_count: number;
    previous_token?: string;
    next_token?: string;
  }
}
