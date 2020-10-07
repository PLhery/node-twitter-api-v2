
export interface Tweetv2SearchParams extends Partial<Tweetv2FieldsParams> {
  /** ISO date string */
  end_time?: string;
  /** ISO date string */
  start_time?: string;
  max_results?: string;
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
  [query: string]: any;
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
