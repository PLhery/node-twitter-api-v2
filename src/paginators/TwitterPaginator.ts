import { TwitterRateLimit, TwitterResponse } from '../types';
import TwitterApiSubClient from '../client.subclient';
import { TRequestQuery } from '../client-mixins/request-maker.mixin';

export interface ITwitterPaginatorArgs<TApiResult, TApiParams, TParams> {
  realData: TApiResult;
  rateLimit: TwitterRateLimit;
  instance: TwitterApiSubClient;
  queryParams: Partial<TApiParams>;
  sharedParams?: TParams;
}

/** TwitterPaginator: able to get consume data from initial request, then fetch next data sequentially. */
export abstract class TwitterPaginator<TApiResult, TApiParams extends object, TItem, TParams = any> {
  protected _realData: TApiResult;
  protected _rateLimit: TwitterRateLimit;
  protected _instance: TwitterApiSubClient;
  protected _queryParams: Partial<TApiParams>;
  protected _maxResultsWhenFetchLast = 100;
  /** informations unrelated to response data/query params that will be shared between paginator instances */
  protected _sharedParams: TParams;

  protected abstract _endpoint: string;

  // noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected
  constructor({ realData, rateLimit, instance, queryParams, sharedParams }: ITwitterPaginatorArgs<TApiResult, TApiParams, TParams>) {
    this._realData = realData;
    this._rateLimit = rateLimit;
    this._instance = instance;
    this._queryParams = queryParams;
    this._sharedParams = sharedParams!;
  }

  protected get _isRateLimitOk() {
    const resetDate = this._rateLimit.reset * 1000;

    if (resetDate < Date.now()) {
      return true;
    }
    return this._rateLimit.remaining > 0;
  }

  protected makeRequest(queryParams: Partial<TApiParams>) {
    return this._instance.get<TApiResult>(this.getEndpoint(), queryParams as TRequestQuery, { fullResponse: true });
  }

  protected makeNewInstanceFromResult(result: TwitterResponse<TApiResult>, queryParams: Partial<TApiParams>): this {
    // Construct a subclass
    return new (this.constructor as any)({
      realData: result.data,
      rateLimit: result.rateLimit!,
      instance: this._instance,
      queryParams,
      sharedParams: this._sharedParams,
    }) as any;
  }

  protected getEndpoint() {
    return this._endpoint;
  }

  protected abstract refreshInstanceFromResult(result: TwitterResponse<TApiResult>, isNextPage: boolean): any;

  protected abstract getNextQueryParams(maxResults?: number): Partial<TApiParams>;

  /* Fetch last needed methods */
  protected abstract getPageLengthFromRequest(result: TwitterResponse<TApiResult>): number;

  protected abstract isFetchLastOver(result: TwitterResponse<TApiResult>): boolean;

  /* Iterator methods */
  protected abstract getItemArray(): TItem[];

  /* ---------------------- */
  /* Real paginator methods */
  /* ---------------------- */

  /**
   * Next page.
   */
  async next(maxResults?: number) {
    const queryParams = this.getNextQueryParams(maxResults);
    const result = await this.makeRequest(queryParams);
    return this.makeNewInstanceFromResult(result, queryParams);
  }

  /**
   * Next page, but store it in current instance.
   */
  async fetchNext(maxResults?: number) {
    const queryParams = this.getNextQueryParams(maxResults);
    const result = await this.makeRequest(queryParams);

    // Await in case of async sub-methods
    await this.refreshInstanceFromResult(result, true);

    return this;
  }

  /**
   * Fetch up to {count} items after current page,
   * as long as rate limit is not hit and Twitter has some results
   */
  async fetchLast(count: number) {
    let queryParams = this.getNextQueryParams(this._maxResultsWhenFetchLast);

    let resultCount = 0;

    // Break at rate limit limit
    while (resultCount < count && this._isRateLimitOk) {
      const response = await this.makeRequest(queryParams);
      await this.refreshInstanceFromResult(response, true);

      resultCount += this.getPageLengthFromRequest(response);

      if (this.isFetchLastOver(response)) {
        break;
      }

      queryParams = this.getNextQueryParams(this._maxResultsWhenFetchLast);
    }

    return this;
  }

  get rateLimit() {
    return { ...this._rateLimit };
  }

  /** Get raw data returned by Twitter API. */
  get data() {
    return this._realData;
  }

  /**
   * Iterate over currently fetched items.
   */
  *[Symbol.iterator](): Generator<TItem, void, undefined> {
    yield* this.getItemArray();
  }

  /**
   * Iterate over items "undefinitely" (until rate limit is hit / they're no more tweets available)
   */
  async *[Symbol.asyncIterator](): AsyncGenerator<TItem, void, undefined> {
    yield* this.getItemArray();
    let paginator = this;

    while (this._isRateLimitOk) {
      const next = await paginator.next(this._maxResultsWhenFetchLast);
      this._rateLimit = next._rateLimit;
      const items = next.getItemArray();
      yield* items;

      if (!items.length) {
        break;
      }

      paginator = next;
    }
  }
}

/** PreviousableTwitterPaginator: a TwitterPaginator able to get consume data from both side, next and previous. */
export abstract class PreviousableTwitterPaginator<TApiResult, TApiParams extends object, TItem, TParams = any>
  extends TwitterPaginator<TApiResult, TApiParams, TItem, TParams>
{
  protected abstract getPreviousQueryParams(maxResults?: number): Partial<TApiParams>;

  /**
   * Previous page (new tweets)
   */
  async previous(maxResults?: number) {
    const queryParams = this.getPreviousQueryParams(maxResults);
    const result = await this.makeRequest(queryParams);
    return this.makeNewInstanceFromResult(result, queryParams);
  }

  /**
   * Previous page, but in current instance.
   */
  async fetchPrevious(maxResults?: number) {
    const queryParams = this.getPreviousQueryParams(maxResults);
    const result = await this.makeRequest(queryParams);

    await this.refreshInstanceFromResult(result, false);

    return this;
  }
}

export default TwitterPaginator;
