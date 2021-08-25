import TwitterPaginator from './TwitterPaginator';
import {
  TwitterResponse,
  UserSearchV1Params,
  UserV1,
} from '../types';

/** A generic TwitterPaginator able to consume TweetV1 timelines. */
export class UserSearchV1Paginator extends TwitterPaginator<UserV1[], UserSearchV1Params, UserV1> {
  _endpoint = 'users/search.json';

  protected refreshInstanceFromResult(response: TwitterResponse<UserV1[]>, isNextPage: true) {
    const result = response.data;
    this._rateLimit = response.rateLimit!;

    if (isNextPage) {
      this._realData.push(...result);
    }
  }

  protected getNextQueryParams(maxResults?: number) {
    const previousPage = Number(this._queryParams.page ?? '1');

    return {
      ...this._queryParams,
      page: previousPage + 1,
      ...maxResults ? { count: maxResults } : {},
    };
  }

  protected getPageLengthFromRequest(result: TwitterResponse<UserV1[]>) {
    return result.data.length;
  }

  protected isFetchLastOver(result: TwitterResponse<UserV1[]>) {
    return !result.data.length;
  }

  protected getItemArray() {
    return this.users;
  }

  /**
   * Users returned by paginator.
   */
  get users() {
    return this._realData;
  }
}
