import type { TypeOrArrayOf } from '../shared.types';
import type { DataMetaAndIncludeV2, DataV2 } from './shared.v2.types';
import type { TTweetv2UserField } from './tweet.v2.types';
import type { UsersV2Params, UsersV2Result, UserV2 } from './user.v2.types';

export interface SpaceV2FieldsParams {
  expansions: TypeOrArrayOf<TSpaceV2Expansion> | string;
  'space.fields': TypeOrArrayOf<TSpaceV2SpaceField> | string;
  'user.fields': TypeOrArrayOf<TTweetv2UserField> | string;
}

export type TSpaceV2Expansion = 'invited_user_ids' | 'speaker_ids' | 'creator_id' | 'host_ids';
export type TSpaceV2SpaceField = 'host_ids' | 'created_at' | 'creator_id' | 'id' | 'lang'
  | 'invited_user_ids' | 'participant_count' | 'speaker_ids' | 'started_at' | 'state' | 'title'
  | 'updated_at' | 'scheduled_start' | 'is_ticketed' | 'topic_ids' | 'ended_at';
export type TSpaceV2State = 'live' | 'scheduled';

// - Requests -

export interface SpaceV2CreatorLookupParams extends SpaceV2FieldsParams {
  max_results?: number;
}

export interface SpaceV2SearchParams extends Partial<SpaceV2FieldsParams> {
  query: string;
  state: TSpaceV2State;
  max_results?: number;
}

export interface SpaceV2BuyersParams extends Partial<UsersV2Params> {}

// - Responses -

type SpaceV2Includes = { users?: UserV2[] };

export type SpaceV2SingleResult = DataV2AndIncludeV2<SpaceV2, SpaceV2Includes>;
export type SpaceV2LookupResult = DataMetaAndIncludeV2<SpaceV2[], { result_count: number }, SpaceV2Includes>;
export type SpaceV2BuyersResult = UsersV2Result;

// - Entities -

export interface SpaceV2 {
  id: string;
  state: TSpaceV2State;
  created_at?: string;
  host_ids?: string[];
  lang?: string;
  is_ticketed?: boolean;
  invited_user_ids?: string[];
  participant_count?: number;
  scheduled_start?: string;
  speaker_ids?: string[];
  started_at?: string;
  title?: string;
  creator_id?: string;
  updated_at?: string;
  topic_ids?: string[];
  ended_at?: string;
}
