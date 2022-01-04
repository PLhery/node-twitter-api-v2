import type { TwitterResponse } from '../types';
import type { DataMetaAndIncludeV2 } from '../types/v2/shared.v2.types';
import { TwitterV2IncludesHelper } from '../v2/includes.v2.helper';
import { PreviousableTwitterPaginator } from './TwitterPaginator';

/** A generic PreviousableTwitterPaginator able to consume v2 timelines that use max_results and pagination tokens. */
export abstract class TimelineV2Paginator<
  TResult extends DataMetaAndIncludeV2<any, any, any>,
  TParams extends { max_results?: number, pagination_token?: string },
  TItem,
  TShared = any,
> extends PreviousableTwitterPaginator<TResult, TParams, TItem, TShared> {
  protected _includesInstance?: TwitterV2IncludesHelper;

  protected refreshInstanceFromResult(response: TwitterResponse<TResult>, isNextPage: boolean) {
    const result = response.data;
    const resultData = result.data ?? [];
    this._rateLimit = response.rateLimit!;

    if (!this._realData.data) {
      this._realData.data = [];
    }

    if (isNextPage) {
      this._realData.meta.result_count += result.meta.result_count;
      this._realData.meta.next_token = result.meta.next_token;
      this._realData.data.push(...resultData);
    }
    else {
      this._realData.meta.result_count += result.meta.result_count;
      this._realData.meta.previous_token = result.meta.previous_token;
      this._realData.data.unshift(...resultData);
    }

    this.updateIncludes(result);
  }

  protected updateIncludes(data: TResult) {
    if (!data.includes) {
      return;
    }
    if (!this._realData.includes) {
      this._realData.includes = {};
    }

    const includesRealData = this._realData.includes;

    for (const [includeKey, includeArray] of Object.entries(data.includes) as [keyof any, any[]][]) {
      if (!includesRealData[includeKey]) {
        includesRealData[includeKey] = [];
      }

      includesRealData[includeKey] = [
        ...includesRealData[includeKey]!,
        ...includeArray,
      ];
    }
  }

  protected getNextQueryParams(maxResults?: number) {
    return {
      ...this.injectQueryParams(maxResults),
      pagination_token: this._realData.meta.next_token,
    };
  }

  protected getPreviousQueryParams(maxResults?: number) {
    return {
      ...this.injectQueryParams(maxResults),
      pagination_token: this._realData.meta.previous_token,
    };
  }

  protected getPageLengthFromRequest(result: TwitterResponse<TResult>) {
    return result.data.data?.length ?? 0;
  }

  protected isFetchLastOver(result: TwitterResponse<TResult>) {
    return !result.data.data?.length || !this.canFetchNextPage(result.data);
  }

  protected canFetchNextPage(result: TResult) {
    return !!result.meta.next_token;
  }

  get meta() {
    return this._realData.meta;
  }

  get includes() {
    if (!this._realData?.includes) {
      return new TwitterV2IncludesHelper(this._realData);
    }
    if (this._includesInstance) {
      return this._includesInstance;
    }
    return this._includesInstance = new TwitterV2IncludesHelper(this._realData);
  }

  get errors() {
    return this._realData.errors ?? [];
  }

  get hasError() {
    return this.errors.length > 0;
  }
}
