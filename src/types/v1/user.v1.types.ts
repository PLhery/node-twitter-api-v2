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

// POST users/report_spam
export interface ReportSpamV1Params {
  screen_name?: string;
  user_id?: string;
  perform_block?: boolean;
}

export interface UserSearchV1Params {
  q?: string;
  page?: number;
  count?: number;
  include_entities?: boolean;
  tweet_mode?: 'extended';
}

// POST account/settings
export interface AccountSettingsV1Params {
  sleep_time_enabled?: boolean;
  start_sleep_time?: number;
  end_sleep_time?: number;
  time_zone?: string;
  trend_location_woeid?: number;
  lang?: string;
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

// GET account/settings
export interface AccountSettingsV1 {
  time_zone: {
    name: string;
    utc_offset: number;
    tzinfo_name: string;
  };
  protected: boolean;
  screen_name: string;
  always_use_https: boolean;
  use_cookie_personalization: boolean;
  sleep_time: {
    enabled: boolean;
    end_time: string | null;
    start_time: string | null;
  };
  geo_enabled: boolean;
  language: string;
  discoverable_by_email: boolean;
  discoverable_by_mobile_phone: boolean;
  display_sensitive_media: boolean;
  allow_contributor_request: 'all' | 'following' | string;
  allow_dms_from: 'all' | 'following' | string;
  allow_dm_groups_from: 'all' | 'following' | string;
  translator_type: string;
  trend_location: {
    name: string;
    countryCode: string;
    url: string;
    woeid: number;
    placeType: {
      name: string;
      code: number;
    };
    parentid: number | null;
    country: string;
  }[];
}
