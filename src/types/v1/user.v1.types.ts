import { UserEntitiesV1 } from './entities.v1.types';
import { TweetV1 } from './tweet.v1.types';

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

type TUserIdOrScreenName = { user_id: string } | { screen_name: string };
type TUserObjectParams = {
  include_entities?: boolean;
  skip_status?: boolean;
  tweet_mode?: 'extended' | 'compat';
};

export interface DoubleEndedIdCursorV1Result {
  next_cursor?: string;
  next_cursor_str?: string;
  previous_cursor?: string;
  previous_cursor_str?: string;
  ids: string[];
}

export interface DoubleEndedIdCursorV1Params {
  stringify_ids?: boolean;
  cursor?: string;
}

export interface UserFriendsIdsV1Params extends DoubleEndedIdCursorV1Params {
  screen_name?: string;
  user_id?: string;
  count?: number;
}

export interface UserFollowerIdsV1Params extends DoubleEndedIdCursorV1Params {
  screen_name?: string;
  user_id?: string;
  count?: number;
}

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
export type MuteUserIdsV1Params = DoubleEndedIdCursorV1Params;

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

// POST account/update_profile
export interface AccountProfileV1Params {
  name?: string;
  url?: string;
  location?: string;
  description?: string;
  profile_link_color?: string;
  include_entities?: boolean;
  skip_status?: boolean;
  tweet_mode?: 'extended';
}

// GET users/profile_banner
export type ProfileBannerSizeV1Params = TUserIdOrScreenName;

// POST account/update_profile_banner
export interface ProfileBannerUpdateV1Params {
  width?: number;
  height?: number;
  offset_left?: number;
  offset_top?: number;
}

// POST account/update_profile_image
export type ProfileImageUpdateV1Params = TUserObjectParams;

export interface FriendshipShowV1Params {
  source_id?: string;
  source_screen_name?: string;
  target_id?: string;
  target_screen_name?: string;
}

export interface FriendshipLookupV1Params {
  screen_name?: string | string[];
  user_id?: string | string[];
}

export type FriendshipsIncomingV1Params = DoubleEndedIdCursorV1Params;

export interface FriendshipUpdateV1Params {
  screen_name?: string;
  user_id?: string;
  device?: boolean;
  retweets?: boolean;
}

export interface FriendshipCreateV1Params {
  screen_name?: string;
  user_id?: string;
  follow?: boolean;
}

export interface FriendshipDestroyV1Params {
  screen_name?: string;
  user_id?: string;
}

export type UserShowV1Params = TUserIdOrScreenName & TUserObjectParams;
export type UserLookupV1Params = {
  user_id?: string | string[];
  screen_name?: string | string[];
} & TUserObjectParams;

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
export type MuteUserIdsV1Result = DoubleEndedIdCursorV1Result;

export type UserFollowerIdsV1Result = DoubleEndedIdCursorV1Result;

export type UserFriendIdsV1Result = DoubleEndedIdCursorV1Result;

// GET users/profile_banner
export interface BannerSizeV1 {
  h: number;
  w: number;
  url: string;
}

export interface ProfileBannerSizeV1 {
  sizes: {
    ipad: BannerSizeV1;
    ipad_retina: BannerSizeV1;
    web: BannerSizeV1;
    web_retina: BannerSizeV1;
    mobile: BannerSizeV1;
    mobile_retina: BannerSizeV1;
    '300x100': BannerSizeV1;
    '600x200': BannerSizeV1;
    '1500x500': BannerSizeV1;
  };
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

export type TFriendshipConnectionV1 = 'following' | 'following_requested' | 'followed_by' | 'none' | 'blocking' | 'muting';

export interface FriendshipRelationObjectV1 {
  id: number;
  id_str: string;
  screen_name: string;
  following: boolean;
  followed_by: boolean;
  live_following?: boolean;
  following_received: boolean | null;
  following_requested: boolean | null;
  notifications_enabled?: boolean | null;
  can_dm?: boolean | null;
  blocking?: boolean | null;
  blocked_by?: boolean | null;
  muting?: boolean | null;
  want_retweets?: boolean | null;
  all_replies?: boolean | null;
  marked_spam?: boolean | null;
}

export interface FriendshipV1 {
  relationship: {
    source: FriendshipRelationObjectV1;
    target: FriendshipRelationObjectV1;
  };
}

export interface FriendshipCreateOrDestroyV1 extends UserV1 {
  status: TweetV1
}

export interface FriendshipLookupV1 {
  name: string;
  screen_name: string;
  id: number;
  id_str: string;
  connections: TFriendshipConnectionV1[];
}

// GET friendships/incoming
export type FriendshipsIncomingV1Result = DoubleEndedIdCursorV1Result;
