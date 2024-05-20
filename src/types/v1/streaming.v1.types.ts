import type { TypeOrArrayOf } from '../shared.types';

export interface AskTweetStreamV1Params {
  tweet_mode?: 'extended' | 'compat';
  /** Specifies whether stall warnings should be delivered. */
  stall_warnings: boolean;
}

/**
 * See https://developer.x.com/en/docs/twitter-api/v1/tweets/filter-realtime/guides/basic-stream-parameters
 * for detailed documentation.
 */
export interface FilterStreamV1Params extends AskTweetStreamV1Params {
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

export interface SampleStreamV1Params extends AskTweetStreamV1Params {
  [otherParameter: string]: any;
}
