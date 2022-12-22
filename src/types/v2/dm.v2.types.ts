import { TypeOrArrayOf } from '../shared.types';
import { TTweetv2MediaField, TTweetv2TweetField, TTweetv2UserField } from './tweet.v2.types';
import { ApiV2Includes, ReferencedTweetV2 } from './tweet.definition.v2';
import { DataMetaAndIncludeV2, PaginableCountMetaV2 } from './shared.v2.types';

export type TDMEventV2Field = 'created_at' | 'follower_count' | 'member_count' | 'private' | 'description' | 'owner_id';
export type TDMEventV2Expansion = 'attachments.media_keys' | 'referenced_tweets.id' | 'sender_id' | 'participant_ids';
export type TDMEventV2EventType = 'MessageCreate' | 'ParticipantsJoin' | 'ParticipantsLeave';

// GET /2/dm_events

export interface GetDMEventV2Params {
    'dm_event.fields': TypeOrArrayOf<TDMEventV2Field> | string;
    event_types: TypeOrArrayOf<TDMEventV2EventType> | string;
    expansions: TypeOrArrayOf<TDMEventV2Expansion> | string;
    max_results: number;
    'media.fields': TypeOrArrayOf<TTweetv2MediaField> | string;
    pagination_token: string;
    'tweet.fields': TypeOrArrayOf<TTweetv2TweetField> | string;
    'user.fields': TypeOrArrayOf<TTweetv2UserField> | string;
}

export type GetDMEventV2Result = DataMetaAndIncludeV2<DMEventV2[], PaginableCountMetaV2, ApiV2Includes>;

// POST dm_conversations/:dm_conversation_id/messages

export interface PostDMInConversationParams {
    attachments?: [{ media_id: string }];
    text?: string;
}

// POST dm_conversations

export interface CreateDMConversationParams {
    conversation_type: 'Group';
    participant_ids: string[];
    message: PostDMInConversationParams;
}

export interface PostDMInConversationResult {
    dm_conversation_id: string;
    dm_event_id: string;
}

// Types

export interface BaseDMEventV2 {
    id: string;
    created_at?: string;
    sender_id?: string;
    dm_conversation_id?: string;
    attachments?: DMEventAttachmentV2;
    referenced_tweets?: ReferencedTweetV2[];
}

export interface DMEventAttachmentV2 {
    media_keys: string[];
}

export type DMEventV2 = ({
    event_type: 'MessageCreate',
    text: string;
} & BaseDMEventV2) | ({
    event_type: Extract<TDMEventV2EventType, 'ParticipantsJoin' | 'ParticipantsLeave'>
} & BaseDMEventV2);
