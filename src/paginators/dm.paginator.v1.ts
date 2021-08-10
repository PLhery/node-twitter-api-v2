import type { GetDmListV1Args, ReceivedDMEventsV1, TReceivedDMEvent, TwitterResponse, ReceivedWelcomeDMCreateEventV1, WelcomeDirectMessageListV1Result } from '../types';
import TwitterPaginator from './TwitterPaginator';

export class DmEventsV1Paginator extends TwitterPaginator<ReceivedDMEventsV1, GetDmListV1Args, TReceivedDMEvent> {
  protected _endpoint = 'direct_messages/events/list.json';

  protected refreshInstanceFromResult(response: TwitterResponse<ReceivedDMEventsV1>, isNextPage: true) {
    const result = response.data;
    this._rateLimit = response.rateLimit!;

    if (isNextPage) {
      this._realData.events.push(...result.events);
      this._realData.next_cursor = result.next_cursor;
    }
  }

  protected getNextQueryParams(maxResults?: number): GetDmListV1Args {
    return {
      ...this._queryParams,
      cursor: this._realData.next_cursor,
      ...(maxResults ? { count: maxResults } : {}),
    };
  }

  protected getPageLengthFromRequest(result: TwitterResponse<ReceivedDMEventsV1>) {
    return result.data.events.length;
  }

  protected isFetchLastOver(result: TwitterResponse<ReceivedDMEventsV1>) {
    return result.data.next_cursor === undefined;
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

export class WelcomeDmV1Paginator extends TwitterPaginator<WelcomeDirectMessageListV1Result, GetDmListV1Args, ReceivedWelcomeDMCreateEventV1> {
  protected _endpoint = 'direct_messages/welcome_messages/list.json';

  protected refreshInstanceFromResult(response: TwitterResponse<WelcomeDirectMessageListV1Result>, isNextPage: true) {
    const result = response.data;
    this._rateLimit = response.rateLimit!;

    if (isNextPage) {
      this._realData.welcome_messages.push(...result.welcome_messages);
      this._realData.next_cursor = result.next_cursor;
    }
  }

  protected getNextQueryParams(maxResults?: number): GetDmListV1Args {
    return {
      ...this._queryParams,
      cursor: this._realData.next_cursor,
      ...(maxResults ? { count: maxResults } : {}),
    };
  }

  protected getPageLengthFromRequest(result: TwitterResponse<WelcomeDirectMessageListV1Result>) {
    return result.data.welcome_messages.length;
  }

  protected isFetchLastOver(result: TwitterResponse<WelcomeDirectMessageListV1Result>) {
    return result.data.next_cursor === undefined;
  }

  protected getItemArray() {
    return this.welcomeMessages;
  }

  get welcomeMessages() {
    return this._realData.welcome_messages;
  }
}
