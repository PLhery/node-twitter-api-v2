import type * as fs from 'fs';
import type { BooleanString, NumberString } from '../shared.types';
import { CoordinateV1, PlaceV1, TweetEntitiesV1, TweetExtendedEntitiesV1 } from './entities.v1.types';
import { UserV1 } from './user.v1.types';

// - Entity -

export interface TweetV1 {
  created_at: string;
  id: number;
  id_str: string;
  text: string;
  full_text?: string;
  source: string;
  truncated: boolean;
  in_reply_to_status_id: number | null;
  in_reply_to_status_id_str: string | null;
  in_reply_to_user_id: number | null;
  in_reply_to_user_id_str: string | null;
  in_reply_to_screen_name: string | null;
  user: UserV1;
  coordinates: CoordinateV1 | null;
  place: PlaceV1 | null;
  quoted_status_id: number;
  quoted_status_id_str: string;
  is_quote_status: boolean;
  quoted_status?: TweetV1;
  retweeted_status?: TweetV1;
  quote_count?: number;
  reply_count?: number;
  retweet_count: number;
  favorite_count: number;
  entities: TweetEntitiesV1;
  extended_entities?: TweetExtendedEntitiesV1;
  favorited: boolean | null;
  retweeted: boolean;
  possibly_sensitive: boolean | null;
  filter_level: 'none' | 'low' | 'medium' | 'high';
  lang: string;
  display_text_range?: [number, number];

  // Additional attributes
  current_user_retweet?: { id: number, id_str: string };
  withheld_copyright?: boolean;
  withheld_in_countries?: string[];
  withheld_scope?: string;
  card_uri?: string;
}

// - Params -

export interface TweetShowV1Params {
  tweet_mode?: 'compat' | 'extended';
  id?: string;
  trim_user?: boolean;
  include_my_retweet?: boolean;
  include_entities?: boolean;
  include_ext_alt_text?: boolean;
  include_card_uri?: boolean;
}

export type TweetLookupV1Params = {
  id?: string | string[];
  map?: boolean;
} & Omit<TweetShowV1Params, 'include_my_retweet'>;
export type TweetLookupNoMapV1Params = TweetLookupV1Params & { map?: false };
export type TweetLookupMapV1Params = TweetLookupV1Params & { map: true };

export interface AskTweetV1Params {
  tweet_mode?: 'extended' | 'compat';
  include_entities?: boolean;
  trim_user?: boolean;
}

export interface TweetV1TimelineParams extends AskTweetV1Params {
  count?: number;
  since_id?: string;
  max_id?: string;
  exclude_replies?: boolean;
}

export interface TweetV1UserTimelineParams extends TweetV1TimelineParams {
  user_id?: string;
  screen_name?: string;
  include_rts?: boolean;
}

export interface SendTweetV1Params extends AskTweetV1Params {
  status: string;
  in_reply_to_status_id?: string;
  auto_populate_reply_metadata?: BooleanString;
  exclude_reply_user_ids?: string;
  attachment_url?: string;
  media_ids?: string | string[];
  possibly_sensitive?: BooleanString;
  lat?: NumberString;
  long?: NumberString;
  display_coordinates?: BooleanString;
  enable_dmcommands?: BooleanString;
  fail_dmcommands?: BooleanString;
  card_uri?: string;
  place_id?: string;
}

export type TUploadTypeV1 = 'mp4' | 'longmp4' | 'mov' |  'gif' | 'jpg' | 'png' | 'srt' | 'webp';

export enum EUploadMimeType {
  Jpeg = 'image/jpeg',
  Mp4 = 'video/mp4',
  Mov = 'video/quicktime',
  Gif = 'image/gif',
  Png = 'image/png',
  Srt = 'text/plain',
  Webp = 'image/webp'
}

export interface UploadMediaV1Params {
  /** @deprecated Directly use `mimeType` parameter with one of the allowed MIME types in `EUploadMimeType`. */
  type: TUploadTypeV1 | string;
  mimeType: EUploadMimeType | string;
  target: 'tweet' | 'dm';
  chunkLength: number;
  shared: boolean;
  longVideo: boolean;
  additionalOwners: string | string[];
  maxConcurrentUploads: number;
}

export interface MediaMetadataV1Params {
  alt_text?: { text: string };
}

export interface MediaSubtitleV1Param {
  media_id: string;
  language_code: string;
  display_name: string;
}

/**
 * Link to a file that is usable as media.
 * - `string`: File path
 * - `Buffer`: File content, as binary buffer
 * - `fs.promises.FileHandle`: Opened file with `fs.promises`
 * - `number`: Opened file with `fs` classic functions
 */
export type TUploadableMedia = string | Buffer | fs.promises.FileHandle | number;

export interface OembedTweetV1Params {
  url: string;
  maxwidth?: number;
  hide_media?: boolean;
  hide_thread?: boolean;
  omit_script?: boolean;
  align?: 'left' | 'right' | 'center' | 'none';
  related?: string;
  lang?: string;
  theme?: 'light' | 'dark';
  link_color?: string;
  widget_type?: 'video';
  dnt?: boolean;
}

// - Results -

export type TweetV1TimelineResult = TweetV1[];

export interface InitMediaV1Result {
  media_id: number;
  media_id_string: string;
  size: number;
  expires_after_secs: number;
  image: {
    image_type: string;
    w: number;
    h: number;
  };
}

export interface MediaStatusV1Result {
  media_id: number;
  media_id_string: string;
  size: number,
  expires_after_secs: number;
  video?: {
    video_type: string;
  };
  processing_info?: {
    state: 'pending' | 'failed' | 'succeeded' | 'in_progress';
    check_after_secs?: number;
    progress_percent?: number;
    error?: {
      code: number;
      name: string;
      message: string;
    };
  };
}

export interface OembedTweetV1Result {
  url: string;
  author_name: string;
  author_url: string;
  html: string;
  width: number;
  height: number | null;
  type: string;
  cache_age: string;
  provider_name: string;
  provider_url: string;
  version: string;
}

export interface TweetLookupMapV1Result {
  id: {
    [tweetId: string]: TweetV1 | null;
  };
}
