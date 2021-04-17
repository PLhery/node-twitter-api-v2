import { MediaSizesV1 } from './entities.v1.types';

export type TAppRateLimitResourceV1 = 'help' | 'statuses' | 'friends' | 'followers'
  | 'users' | 'search' | 'trends' | 'favorites' | 'friendships' | 'direct_messages'
  | 'lists' | 'geo' | 'account' | 'application' | 'account_activity';

export interface AppRateLimitV1Result {
  rate_limit_context: { access_token: string };
  resources: {
    [TResourceName in TAppRateLimitResourceV1]?: {
      [resourceEndpoint: string]: AppRateLimitEndpointV1;
    };
  };
}

export interface AppRateLimitEndpointV1 {
  limit: number;
  remaining: number;
  reset: number;
}

export interface HelpLanguageV1Result {
  code: string;
  status: string;
  name: string;
}

export interface HelpConfigurationV1Result {
  characters_reserved_per_media: number;
  dm_text_character_limit: number;
  max_media_per_upload: number;
  photo_size_limit: number;
  photo_sizes: MediaSizesV1;
  short_url_length: number;
  short_url_length_https: number;
  non_username_paths: string[];
}
