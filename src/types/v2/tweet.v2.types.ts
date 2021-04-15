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

export type TTweetv2Expansion = 'attachments.poll_ids' | 'attachments.media_keys'
  | 'author_id' | 'referenced_tweets.id' | 'in_reply_to_user_id'
  | 'geo.place_id' | 'entities.mentions.username' | 'referenced_tweets.id.author_id';
export type TTweetv2MediaField = 'duration_ms' | 'height' | 'media_key' | 'preview_image_url' | 'type' | 'url' | 'width' | 'public_metrics';
export type TTweetv2PlaceField = 'contained_within' | 'country' | 'country_code' | 'full_name' | 'geo' | 'id' | 'name' | 'place_type';
export type TTweetv2PollField = 'duration_minutes' | 'end_datetime' | 'id' | 'options' | 'voting_status';
export type TTweetv2TweetField = 'attachments' | 'author_id' | 'context_annotations' | 'conversation_id'
  | 'created_at' | 'entities' | 'geo' | 'id' | 'in_reply_to_user_id' | 'lang' | 'public_metrics'
  | 'possibly_sensitive' | 'referenced_tweets' | 'reply_settings' | 'source' | 'text' | 'withheld';
export type TTweetv2UserField = 'created_at' | 'description' | 'entities' | 'id' | 'location'
  | 'name' | 'pinned_tweet_id' | 'profile_image_url' | 'protected' | 'public_metrics'
  | 'url' | 'username' | 'verified' | 'withheld';

export interface Tweetv2FieldsParams {
  expansions: TTweetv2Expansion | string;
  'media.fields': TTweetv2MediaField | string;
  'place.fields': TTweetv2PlaceField | string;
  'poll.fields': TTweetv2PollField | string;
  'tweet.fields': TTweetv2TweetField | string;
  'user.fields': TTweetv2UserField | string;
}

// TODO type
export interface TweetV2 {
  [field: string]: any;
}

export interface Tweetv2SearchResult {
  data: TweetV2[];
  meta: {
    newest_id: string;
    oldest_id: string;
    result_count: number;
    next_token: string;
  };
}
