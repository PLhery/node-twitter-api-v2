import { CursoredV1Paginator } from './paginator.v1';
import type { UserFollowerIdsV1Params, UserFollowerIdsV1Result, TwitterResponse } from '../types';

export class UserFollowerIdsV1Paginator extends CursoredV1Paginator<UserFollowerIdsV1Result, UserFollowerIdsV1Params, string> {
  protected _endpoint = 'followers/ids.json';
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