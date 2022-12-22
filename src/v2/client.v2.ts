import { API_V2_PREFIX } from '../globals';
import TwitterApiv2ReadWrite from './client.v2.write';
import TwitterApiv2Labs from '../v2-labs/client.v2.labs';
import { GetDMEventV2Params, GetDMEventV2Result } from '../types/v2/dm.v2.types';
import { ConversationDMTimelineV2Paginator, FullDMTimelineV2Paginator, OneToOneDMTimelineV2Paginator } from '../paginators/dm.paginator.v2';

/**
 * Twitter v2 client with all rights (read/write/DMs)
 */
export class TwitterApiv2 extends TwitterApiv2ReadWrite {
  protected _prefix = API_V2_PREFIX;
  protected _labs?: TwitterApiv2Labs;

  /* Sub-clients */

  /**
   * Get a client with read/write rights.
   */
  public get readWrite() {
    return this as TwitterApiv2ReadWrite;
  }

  /**
   * Get a client for v2 labs endpoints.
   */
  public get labs() {
    if (this._labs) return this._labs;

    return this._labs = new TwitterApiv2Labs(this);
  }

  /** API endpoints */

  /**
   * Returns a list of Direct Messages for the authenticated user, both sent and received.
   * Direct Message events are returned in reverse chronological order.
   * Supports retrieving events from the previous 30 days.
   *
   * OAuth 2 scopes: `dm.read`, `tweet.read`, `user.read`
   *
   * https://developer.twitter.com/en/docs/twitter-api/direct-messages/lookup/api-reference/get-dm_events
   */
  public async listDmEvents(options: Partial<GetDMEventV2Params> = {}) {
    const initialRq = await this.get<GetDMEventV2Result>('dm_events', options, { fullResponse: true });

    return new FullDMTimelineV2Paginator({
      realData: initialRq.data,
      rateLimit: initialRq.rateLimit!,
      instance: this,
      queryParams: { ...options },
    });
  }

  /**
   * Returns a list of Direct Messages (DM) events within a 1-1 conversation with the user specified in the participant_id path parameter.
   * Messages are returned in reverse chronological order.
   *
   * OAuth 2 scopes: `dm.read`, `tweet.read`, `user.read`
   *
   * https://developer.twitter.com/en/docs/twitter-api/direct-messages/lookup/api-reference/get-dm_conversations-dm_conversation_id-dm_events
   */
  public async listDmEventsWithParticipant(participantId: string, options: Partial<GetDMEventV2Params> = {}) {
    const params = { participant_id: participantId };
    const initialRq = await this.get<GetDMEventV2Result>('dm_conversations/with/:participant_id/dm_events', options, { fullResponse: true, params });

    return new OneToOneDMTimelineV2Paginator({
      realData: initialRq.data,
      rateLimit: initialRq.rateLimit!,
      instance: this,
      queryParams: { ...options },
      sharedParams: params,
    });
  }

  /**
   * Returns a list of Direct Messages within a conversation specified in the dm_conversation_id path parameter.
   * Messages are returned in reverse chronological order.
   *
   * OAuth 2 scopes: `dm.read`, `tweet.read`, `user.read`
   *
   * https://developer.twitter.com/en/docs/twitter-api/direct-messages/lookup/api-reference/get-dm_conversations-dm_conversation_id-dm_events
   */
  public async listDmEventsOfConversation(dmConversationId: string, options: Partial<GetDMEventV2Params> = {}) {
    const params = { dm_conversation_id: dmConversationId };
    const initialRq = await this.get<GetDMEventV2Result>('dm_conversations/:dm_conversation_id/dm_events', options, { fullResponse: true, params });

    return new ConversationDMTimelineV2Paginator({
      realData: initialRq.data,
      rateLimit: initialRq.rateLimit!,
      instance: this,
      queryParams: { ...options },
      sharedParams: params,
    });
  }
}

export default TwitterApiv2;
