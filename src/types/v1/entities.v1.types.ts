export interface TweetEntitiesV1 {
  hashtags?: HashtagEntityV1[];
  urls?: UrlEntityV1[];
  user_mentions?: MentionEntityV1[];
  symbols?: SymbolEntityV1[];
  media?: MediaEntityV1[];
  polls?: [PollEntityV1];
}

export interface TweetExtendedEntitiesV1 {
  media?: MediaEntityV1[];
}

export interface UserEntitiesV1 {
  url?: { urls: UrlEntityV1[]; };
  description?: { urls: UrlEntityV1[]; };
}

export interface UrlEntityV1 {
  display_url: string;
  expanded_url: string;
  indices: [number, number];
  url: string;
  unwound?: {
    url: string;
    status: number;
    title: string;
    description: string;
  };
}

export interface MediaEntityV1 {
  display_url: string;
  expanded_url: string;
  url: string;
  id: number;
  id_str: string;
  indices: [number, number];
  media_url: string;
  media_url_https: string;
  sizes: {
    thumb: MediaSizeObjectV1;
    large: MediaSizeObjectV1;
    medium: MediaSizeObjectV1;
    small: MediaSizeObjectV1;
  };
  source_status_id: number;
  source_status_id_str: string;
  type: 'photo' | 'video' | 'animated_gif';
  video_info?: MediaVideoInfoV1;
  additional_media_info?: AdditionalMediaInfoV1;
}

export interface MediaVideoInfoV1 {
  aspect_ratio: [number, number];
  variants: {
    bitrate: number;
    content_type: string;
    url: string;
  }[];
}

export interface AdditionalMediaInfoV1 {
  title: string;
  description: string;
  embeddable: boolean;
  monetizable: boolean;
}

export interface MediaSizeObjectV1 {
  w: number;
  h: number;
  resize: 'crop' | 'fit';
}

export interface HashtagEntityV1 {
  indices: [number, number];
  text: string;
}

export interface MentionEntityV1 {
  id: number;
  id_str: string;
  indices: [number, number];
  name: string;
  screen_name: string;
}

export interface SymbolEntityV1 {
  indices: [number, number];
  text: string;
}

export interface PollEntityV1 {
  options: PollPositionV1[];
  end_datetime: string;
  duration_minutes: number;
}

export interface PollPositionV1 {
  position: number;
  text: string;
}

/** See GeoJSON. */
export interface CoordinateV1 {
  coordinates: number[] | number[][];
  type: string;
}

export interface PlaceV1 {
  full_name: string;
  id: string;
  url: string;
  country: string;
  country_code: string;
  bounding_box: CoordinateV1;
  name: string;
  place_type: string;
  attributes: any | null;
}
