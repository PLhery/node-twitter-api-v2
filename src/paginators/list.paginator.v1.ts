import { DoubleEndedListsCursorV1Result, DoubleEndedUsersCursorV1Result, ListMembersV1Params, ListOwnershipsV1Params, ListV1, TwitterResponse, UserV1 } from '../types';
import { CursoredV1Paginator } from './paginator.v1';

abstract class ListListsV1Paginator extends CursoredV1Paginator<DoubleEndedListsCursorV1Result, ListOwnershipsV1Params, ListV1> {
  protected refreshInstanceFromResult(response: TwitterResponse<DoubleEndedListsCursorV1Result>, isNextPage: true) {
    const result = response.data;
    this._rateLimit = response.rateLimit!;

    if (isNextPage) {
      this._realData.lists.push(...result.lists);
      this._realData.next_cursor = result.next_cursor;
    }
  }

  protected getPageLengthFromRequest(result: TwitterResponse<DoubleEndedListsCursorV1Result>) {
    return result.data.lists.length;
  }

  protected getItemArray() {
    return this.lists;
  }

  /**
   * Lists returned by paginator.
   */
  get lists() {
    return this._realData.lists;
  }
}

export class ListMembershipsV1Paginator extends ListListsV1Paginator {
  protected _endpoint = 'lists/memberships.json';
}

export class ListOwnershipsV1Paginator extends ListListsV1Paginator {
  protected _endpoint = 'lists/ownerships.json';
}

export class ListSubscriptionsV1Paginator extends ListListsV1Paginator {
  protected _endpoint = 'lists/subscriptions.json';
}

abstract class ListUsersV1Paginator extends CursoredV1Paginator<DoubleEndedUsersCursorV1Result, ListMembersV1Params, UserV1> {
  protected refreshInstanceFromResult(response: TwitterResponse<DoubleEndedUsersCursorV1Result>, isNextPage: true) {
    const result = response.data;
    this._rateLimit = response.rateLimit!;

    if (isNextPage) {
      this._realData.users.push(...result.users);
      this._realData.next_cursor = result.next_cursor;
    }
  }

  protected getPageLengthFromRequest(result: TwitterResponse<DoubleEndedUsersCursorV1Result>) {
    return result.data.users.length;
  }

  protected getItemArray() {
    return this.users;
  }

  /**
   * Users returned by paginator.
   */
  get users() {
    return this._realData.users;
  }
}

export class ListMembersV1Paginator extends ListUsersV1Paginator {
  protected _endpoint = 'lists/members.json';
}

export class ListSubscribersV1Paginator extends ListUsersV1Paginator {
  protected _endpoint = 'lists/subscribers.json';
}
