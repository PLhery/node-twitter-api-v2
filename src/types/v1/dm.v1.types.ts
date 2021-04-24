import { CoordinateV1, MediaEntityV1, TweetEntitiesV1 } from './entities.v1.types';

// Creation of DMs
export enum EDirectMessageEventTypeV1 {
  Create = 'message_create',
  WelcomeCreate = 'welcome_message_create',
}

export interface MessageCreateEventV1 {
  target: {
    recipient_id: string;
  };
  message_data: MessageCreateDataV1;
  custom_profile_id?: string;
}

export interface MessageCreateDataV1 {
  text: string;
  attachment?: MessageCreateAttachmentV1;
  quick_reply?: MessageCreateQuickReplyV1;
  ctas?: MessageCreateCtaV1[];
}

export interface MessageCreateCtaV1 {
  type: 'web_url';
  url: string;
  label: string;
  /** Only when messages are retrived from API */
  tco_url?: string;
}

export interface MessageCreateQuickReplyOptionV1 {
  label: string;
  description?: string;
  metadata?: string;
}

export interface MessageCreateQuickReplyV1 {
  type: 'options';
  options: MessageCreateQuickReplyOptionV1[];
}

export type MessageCreateAttachmentV1 = {
  type: 'media';
  media: { id: string };
} & {
  type: 'location';
  location: MessageCreateLocationV1;
};

export type MessageCreateLocationV1 = {
  type: 'shared_coordinate';
  shared_coordinate: {
    coordinates: CoordinateV1;
  };
} & {
  type: 'shared_place';
  shared_place: {
    place: { id: string };
  };
};

// - Params -

export interface SendDMV1Params extends MessageCreateDataV1 {
  recipient_id: string;
}

export interface CreateDMEventV1Args {
  event: CreateDMEventV1;
}

export interface CreateDMEventV1 {
  type: EDirectMessageEventTypeV1;
  [EDirectMessageEventTypeV1.Create]?: MessageCreateEventV1;
}

export interface GetDmListV1Args {
  cursor?: string;
  count?: number;
}

export interface CreateWelcomeDMEventV1Args {
  [EDirectMessageEventTypeV1.WelcomeCreate]: {
    name: string;
    message_data: MessageCreateDataV1;
  };
}

// - Responses -

// Responses of DMs (payload replied by API)
export interface DirectMessageCreateV1 extends RecievedDirectMessageEventV1 {
  type: EDirectMessageEventTypeV1.Create;
  [EDirectMessageEventTypeV1.Create]: ReceivedMessageCreateEventV1;
}

export interface RecievedDirectMessageEventV1 {
  type: EDirectMessageEventTypeV1;
  id: string;
  created_timestamp: string;
  initiated_via?: { tweet_id?: string, welcome_message_id?: string };
}

export interface ReceivedMessageCreateEventV1 {
  target: { recipient_id: string };
  sender_id: string;
  source_app_id: string;
  message_data: ReceivedMessageCreateDataV1;
  custom_profile_id?: string;
}

export interface ReceivedMessageCreateDataV1 {
  text: string;
  entities: TweetEntitiesV1;
  quick_reply_response?: { type: 'options', metadata?: string };
  attachment?: MediaEntityV1;
  quick_reply?: MessageCreateQuickReplyV1;
  ctas?: MessageCreateCtaV1[];
}
// -- end dm event entity

export interface ReceivedWelcomeDMCreateEventV1 {
  id: string;
  created_timestamp: string;
  message_data: ReceivedMessageCreateDataV1;
  name?: string;
}

export type DirectMessageCreateV1Result = { event: DirectMessageCreateV1 } & ReceivedDMAppsV1;

export interface ReceivedDMAppsV1 {
  apps?: ReceivedDMAppListV1;
}

// TODO add other events
export type TReceivedDMEvent = DirectMessageCreateV1;

// GET direct_messages/events/show
export interface ReceivedDMEventV1 extends ReceivedDMAppsV1 {
  event: TReceivedDMEvent;
}

// GET direct_messages/events/list
export interface ReceivedDMEventsV1 extends ReceivedDMAppsV1 {
  next_cursor?: string;
  events: TReceivedDMEvent[];
}

export interface ReceivedDMAppListV1 {
  [appId: string]: {
    id: string;
    name: string;
    url: string;
  };
}

// -- Welcome messages --

// POST direct_messages/welcome_messages/new
export interface WelcomeDirectMessageCreateV1Result extends ReceivedDMAppsV1 {
  [EDirectMessageEventTypeV1.WelcomeCreate]: ReceivedWelcomeDMCreateEventV1;
  name?: string;
}

// GET direct_messages/welcome_messages/list
export interface WelcomeDirectMessageListV1Result extends ReceivedDMAppsV1 {
  next_cursor?: string;
  welcome_messages: ReceivedWelcomeDMCreateEventV1[];
}

// -- Welcome message rules --

export interface CreateWelcomeDmRuleV1 {
  welcome_message_id: string;
}

export interface WelcomeDmRuleV1 extends CreateWelcomeDmRuleV1 {
  id: string;
  created_timestamp: string;
}

export interface WelcomeDmRuleV1Result {
  welcome_message_rule: WelcomeDmRuleV1;
}

export interface WelcomeDmRuleListV1Result {
  next_cursor?: string;
  welcome_message_rules: WelcomeDmRuleV1[];
}

// -- Custom profiles --

export interface DmCustomProfileV1 {
  name: string;
  avatar: { media: MediaEntityV1 };
}

export interface ReceivedDmCustomProfileV1 extends DmCustomProfileV1 {
  id: string;
  created_timestamp: string;
}

export interface ReceivedDmCustomProfileItemV1 {
  custom_profile: ReceivedDmCustomProfileV1;
}

export interface ReceivedDmCustomProfileListV1 {
  next_cursor?: string;
  custom_profiles: ReceivedDmCustomProfileV1[];
}
