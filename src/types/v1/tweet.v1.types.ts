import type { BooleanString, NumberString } from '../shared.types';
import type fs from 'fs';
import { UserV1 } from './user.v1.types';
import { CoordinateV1, PlaceV1, TweetEntitiesV1, TweetExtendedEntitiesV1 } from './entities.v1.types';

// - Entity -

export interface TweetV1 {
  created_at: string;
  id: number;
  id_str: string;
  text: string;
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
  extended_entities: TweetExtendedEntitiesV1;
  favorited: boolean | null;
  retweeted: boolean;
  possibly_sensitive: boolean | null;
  filter_level: 'none' | 'low' | 'medium' | 'high';
  lang: string;

  // Additionnal attributes
  current_user_retweet?: { id: number, id_str: string };
  withheld_copyright?: boolean;
  withheld_in_countries?: string[];
  withheld_scope?: string;
}

// - Params -

export interface SendTweetV1Params {
  status: string;
  in_reply_to_status_id?: string;
  auto_populate_reply_metadata?: BooleanString;
  exclude_reply_user_ids?: string;
  attachment_url?: string;
  media_ids?: string;
  possibly_sensitive?: BooleanString;
  lat?: NumberString;
  long?: NumberString;
  display_coordinates?: BooleanString;
  trim_user?: BooleanString;
  enable_dmcommands?: BooleanString;
  fail_dmcommands?: BooleanString;
  card_uri?: string;
}

export type TUploadTypeV1 = 'mp4' | 'longmp4' | 'gif' | 'jpg' | 'png' | 'srt' | 'webp';

export interface UploadMediaV1Params {
  type: TUploadTypeV1;
  chunkLength: number;
  additionalOwners: string;
  maxConcurrentUploads: number;
  target: 'tweet' | 'dm';
}

export interface MediaMetadataV1Params {
  alt_text?: string;
}

export interface MediaSubtitleV1Param {
  media_id: string;
  language_code: string;
  display_name: string;
}

export type TUploadableMedia = string | Buffer | fs.promises.FileHandle | number;

// - Results -

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

export interface FinalizeMediaV1Result {
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
  };
}


