import { UserEntitiesV1 } from './entities.v1.types';

// - Entities -

export interface UserV1 {
  id_str: string;
  id: number;
  name: string;
  screen_name: string;
  location: string;
  derived?: any;
  url: string | null;
  description: string | null;
  protected: boolean;
  verified: boolean;
  followers_count: number;
  friends_count: number;
  listed_count: number;
  favourites_count: number;
  statuses_count: number;
  created_at: string;
  profile_banner_url: string;
  profile_image_url_https: string;
  default_profile: boolean;
  default_profile_image: boolean;
  withheld_in_countries: string[];
  withheld_scope: string;
  entities?: UserEntitiesV1;

  /** Only on account/verify_credentials with include_email: true */
  email?: string;
}

// - Params -

export interface VerifyCredentialsV1Params {
  include_entities?: boolean;
  skip_status?: boolean;
  include_email?: boolean;
}

// GET mutes/users/list
export interface MuteUserListV1Params {
  cursor?: string;
  include_entities?: boolean;
  skip_status?: string;
  tweet_mode?: 'extended';
}

// GET mutes/users/ids
export interface MuteUserIdsV1Params {
  stringify_ids?: boolean;
  cursor?: string;
}

// - Results -

// GET mutes/users/list
export interface MuteUserListV1Result {
  next_cursor?: string;
  next_cursor_str?: string;
  previous_cursor?: string;
  previous_cursor_str?: string;
  users: UserV1[];
}

// GET mutes/users/ids
export interface MuteUserIdsV1Result {
  next_cursor?: string;
  next_cursor_str?: string;
  previous_cursor?: string;
  previous_cursor_str?: string;
  ids: string[];
}
