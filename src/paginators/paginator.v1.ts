import { TwitterResponse } from '../types';
import TwitterPaginator from './TwitterPaginator';

export abstract class CursoredV1Paginator<
  TApiResult extends { next_cursor_str?: string, next_cursor?: string },
  TApiParams extends { cursor?: string },
  TItem,
  TParams = any,
> extends TwitterPaginator<TApiResult, TApiParams, TItem, TParams> {
  protected getNextQueryParams(maxResults?: number): Partial<TApiParams> {
    return {
      ...this._queryParams,
      cursor: this._realData.next_cursor_str ?? this._realData.next_cursor,
      ...(maxResults ? { count: maxResults } : {}),
    };
  }

  protected isFetchLastOver(result: TwitterResponse<TApiResult>) {
    // If we cant fetch next page
    return !this.canFetchNextPage(result.data);
  }

  protected canFetchNextPage(result: TApiResult) {
    // If one of cursor is valid
    return !this.isNextCursorInvalid(result.next_cursor) || !this.isNextCursorInvalid(result.next_cursor_str);
  }

  private isNextCursorInvalid(value: string | number | undefined) {
    return value === undefined
      || value === 0
      || value === -1
      || value === '0'
      || value === '-1';
  }
}
