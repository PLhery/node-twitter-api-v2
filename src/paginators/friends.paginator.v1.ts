import { CursoredV1Paginator } from './paginator.v1';
import type { UserFriendsIdsV1Params, UserFriendIdsV1Result, TwitterResponse } from '../types';

export class UserFriendIdsV1Paginator extends CursoredV1Paginator<UserFriendIdsV1Result, UserFriendsIdsV1Params, string> {
  protected _endpoint = 'friends/ids.json';
  protected _maxResultsWhenFetchLast = 5000;

  protected refreshInstanceFromResult(response: TwitterResponse<UserFriendIdsV1Result>, isNextPage: true) {
    const result = response.data;
    this._rateLimit = response.rateLimit!;

    if (isNextPage) {
      this._realData.ids.push(...result.ids);
      this._realData.next_cursor = result.next_cursor;
    }
  }

  protected getPageLengthFromRequest(result: TwitterResponse<UserFriendIdsV1Result>) {
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