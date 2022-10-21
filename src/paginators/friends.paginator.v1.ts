import { CursoredV1Paginator } from './paginator.v1';
import type { UserFollowerIdsV1Params, UserFollowerIdsV1Result, UserFriendListV1Params, UserFriendListV1Result, UserV1, TwitterResponse } from '../types';

export class UserFriendListV1Paginator extends CursoredV1Paginator<UserFriendListV1Result, UserFriendListV1Params, UserV1> {
  protected _endpoint = 'friends/list.json';

  protected refreshInstanceFromResult(response: TwitterResponse<UserFriendListV1Result>, isNextPage: true) {
    const result = response.data;
    this._rateLimit = response.rateLimit!;

    if (isNextPage) {
      this._realData.users.push(...result.users);
      this._realData.next_cursor = result.next_cursor;
    }
  }

  protected getPageLengthFromRequest(result: TwitterResponse<UserFriendListV1Result>) {
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

export class UserFollowersIdsV1Paginator extends CursoredV1Paginator<UserFollowerIdsV1Result, UserFollowerIdsV1Params, string> {
  protected _endpoint = 'friends/ids.json';
  protected _maxResultsWhenFetchLast = 5000;

  protected refreshInstanceFromResult(response: TwitterResponse<UserFollowerIdsV1Result>, isNextPage: true) {
    const result = response.data;
    this._rateLimit = response.rateLimit!;

    if (isNextPage) {
      this._realData.ids.push(...result.ids);
      this._realData.next_cursor = result.next_cursor;
    }
  }

  protected getPageLengthFromRequest(result: TwitterResponse<UserFollowerIdsV1Result>) {
    return result.data.ids.length;
  }

  protected getItemArray() {
    return this.ids;
  }

  /**
   * Users IDs returned by paginator.
   */
  get ids() {
    return this._realData.ids;
  }
}
