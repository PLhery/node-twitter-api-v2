// Tweets
export interface Tweetv2SearchParams extends Partial<Tweetv2FieldsParams> {
  /** ISO date string */
  end_time?: string;
  /** ISO date string */
  start_time?: string;
  max_results?: number | string;
  next_token?: string;
  query: string;
  since_id?: string;
  until_id?: string;
}

export interface Tweetv2FieldsParams {
  expansions: string;
  'media.fields': string;
  'place.fields': string;
  'poll.fields': string;
  'tweet.fields': string;
  'user.fields': string;
}

// TODO type
export interface Tweet {
  [field: string]: any;
}

export interface Tweetv2SearchResult {
  data: Tweet[];
  meta: {
    newest_id: string;
    oldest_id: string;
    result_count: number;
    next_token: string;
  };
}

// Entities
interface Entity {
  start: number;
  end: number;
}
interface UrlEntity extends Entity {
  url: string; // https;//t.co/...
  expanded_url: string; // https://unfollow.ninja/
  display_url: string; // unfollow.ninja
}
interface HashtagEntity extends Entity {
  hashtag: string;
}
interface CashtagEntity extends Entity {
  cashtag: string;
}
interface MentionEntity extends Entity {
  username: string;
}

// Users
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

export interface User {
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

export interface UserResult {
  data: User
  includes?: {
    tweets: [Tweet]; // pinned tweet
  }
}

export interface UsersResult {
  data: User[]
  includes?: {
    tweets: Tweet[]; // pinned tweets
  }
}


export interface FollowersResult {
  data: User[];
  meta: {
    result_count: number;
    previous_token?: string;
    next_token?: string;
  }
}

