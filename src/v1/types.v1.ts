import { BooleanString, NumberString } from '../types';

type TypeOrArrayOf<T> = T | T[];

export interface SendTweetParams {
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

/**
 * See https://developer.twitter.com/en/docs/twitter-api/v1/tweets/filter-realtime/guides/basic-stream-parameters
 * for detailed documentation.
 */
export interface FilterStreamParams {
  /** A list of user IDs, indicating the users to return statuses for in the stream. */
  follow: TypeOrArrayOf<(string | BigInt)>;
  /** Keywords to track. */
  track: TypeOrArrayOf<string>;
  /** Specifies a set of bounding boxes to track. */
  locations: TypeOrArrayOf<{ lng: string, lat: string }>;
  /** Specifies whether stall warnings should be delivered. */
  stall_warnings: boolean;

  [otherParameter: string]: any;
}

export interface SampleStreamParams {
  /** Specifies whether stall warnings should be delivered. */
  stall_warnings: boolean;

  [otherParameter: string]: any;
}

// TODO include 'twitter-d' package to type users, tweets, etc?

export interface InitMediaResult {
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

export interface FinalizeMediaResult {
  media_id: number;
  media_id_string: string;
  size: number,
  expires_after_secs: number;
  video?: {
    video_type: string;
  };
  processing_info?: {
    state: 'pending' | 'failed' | 'succeeded' | 'in_progress';
    check_after_secs?: number;
    progress_percent?: number;
  };
}

export interface UploadMediaParams {
  type: 'mp4' | 'longmp4' | 'gif' | 'jpg' | 'png' | string;
  chunkLength: number;
  additionalOwners: string;
  maxConcurrentUploads: number;
}
