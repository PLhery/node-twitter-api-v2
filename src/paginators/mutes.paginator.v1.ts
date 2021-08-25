import { CursoredV1Paginator } from './paginator.v1';
import type { MuteUserIdsV1Params, MuteUserIdsV1Result, MuteUserListV1Params, MuteUserListV1Result, TwitterResponse, UserV1 } from '../types';

export class MuteUserListV1Paginator extends CursoredV1Paginator<MuteUserListV1Result, MuteUserListV1Params, UserV1> {
  protected _endpoint = 'mutes/users/list.json';

  protected refreshInstanceFromResult(response: TwitterResponse<MuteUserListV1Result>, isNextPage: true) {
    const result = response.data;
    this._rateLimit = response.rateLimit!;

    if (isNextPage) {
      this._realData.users.push(...result.users);
      this._realData.next_cursor = result.next_cursor;
    }
  }

  protected getPageLengthFromRequest(result: TwitterResponse<MuteUserListV1Result>) {
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

export class MuteUserIdsV1Paginator extends CursoredV1Paginator<MuteUserIdsV1Result, MuteUserIdsV1Params, string> {
  protected _endpoint = 'mutes/users/ids.json';
  protected _maxResultsWhenFetchLast = 5000;

  protected refreshInstanceFromResult(response: TwitterResponse<MuteUserIdsV1Result>, isNextPage: true) {
    const result = response.data;
    this._rateLimit = response.rateLimit!;

    if (isNextPage) {
      this._realData.ids.push(...result.ids);
      this._realData.next_cursor = result.next_cursor;
    }
  }

  protected getPageLengthFromRequest(result: TwitterResponse<MuteUserIdsV1Result>) {
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
