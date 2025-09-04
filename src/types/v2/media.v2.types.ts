export type MediaV2MediaCategory = 'tweet_image' | 'tweet_video' | 'tweet_gif' | 'dm_image' | 'dm_video' | 'dm_gif' | 'subtitles' | 'amplify_video';

export interface MediaV2UploadInitParams {
  additional_owners?: string[];
  media_category?: MediaV2MediaCategory;
  media_type: string;
  total_bytes: number;
}

export interface MediaV2UploadAppendParams {
  segment_index: number;
  media: Buffer;
}

export interface MediaV2ProcessingInfo {
  state: 'pending' | 'in_progress' | 'failed' | 'succeeded';
  check_after_secs?: number;
  error?: {
    code: number;
    message: string;
  };
}

export interface MediaV2UploadResponse {
  data: {
    id: string;
    media_key: string;
    size?: number;
    expires_after_secs: number;
    processing_info?: MediaV2ProcessingInfo;
  };
}

export interface MediaV2MetadataCreateParams {
  alt_text?: { text: string };
}

export interface MediaV2MetadataCreateResult {
  data: {
    id: string;
    associated_metadata: {
      alt_text: { text: string };
    };
  };
}
