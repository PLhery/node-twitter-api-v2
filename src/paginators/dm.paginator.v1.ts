import type { GetDmListV1Args, ReceivedDMEventsV1, TReceivedDMEvent, TwitterResponse, ReceivedWelcomeDMCreateEventV1, WelcomeDirectMessageListV1Result } from '../types';
import { CursoredV1Paginator } from './paginator.v1';

export class DmEventsV1Paginator extends CursoredV1Paginator<ReceivedDMEventsV1, GetDmListV1Args, TReceivedDMEvent> {
  protected _endpoint = 'direct_messages/events/list.json';

  protected refreshInstanceFromResult(response: TwitterResponse<ReceivedDMEventsV1>, isNextPage: true) {
    const result = response.data;
    this._rateLimit = response.rateLimit!;

    if (isNextPage) {
      this._realData.events.push(...result.events);
      this._realData.next_cursor = result.next_cursor;
    }
  }

  protected getPageLengthFromRequest(result: TwitterResponse<ReceivedDMEventsV1>) {
    return result.data.events.length;
  }

  protected getItemArray() {
    return this.events;
  }

  /**
   * Events returned by paginator.
   */
  get events() {
    return this._realData.events;
  }
}

export class WelcomeDmV1Paginator extends CursoredV1Paginator<WelcomeDirectMessageListV1Result, GetDmListV1Args, ReceivedWelcomeDMCreateEventV1> {
  protected _endpoint = 'direct_messages/welcome_messages/list.json';

  protected refreshInstanceFromResult(response: TwitterResponse<WelcomeDirectMessageListV1Result>, isNextPage: true) {
    const result = response.data;
    this._rateLimit = response.rateLimit!;

    if (isNextPage) {
      this._realData.welcome_messages.push(...result.welcome_messages);
      this._realData.next_cursor = result.next_cursor;
    }
  }

  protected getPageLengthFromRequest(result: TwitterResponse<WelcomeDirectMessageListV1Result>) {
    return result.data.welcome_messages.length;
  }

  protected getItemArray() {
    return this.welcomeMessages;
  }

  get welcomeMessages() {
    return this._realData.welcome_messages;
  }
}
