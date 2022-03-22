import type { GetListTimelineV2Params, ListTimelineV2Result, ListV2 } from '../types';
import { TimelineV2Paginator } from './v2.paginator';

abstract class ListTimelineV2Paginator<
  TResult extends ListTimelineV2Result,
  TParams extends GetListTimelineV2Params,
  TShared = any,
> extends TimelineV2Paginator<TResult, TParams, ListV2, TShared> {
  protected getItemArray() {
    return this.lists;
  }

  /**
   * Lists returned by paginator.
   */
  get lists() {
    return this._realData.data ?? [];
  }

  get meta() {
    return super.meta as TResult['meta'];
  }
}

export class UserOwnedListsV2Paginator extends ListTimelineV2Paginator<ListTimelineV2Result, GetListTimelineV2Params, { id: string }> {
  protected _endpoint = 'users/:id/owned_lists';
}

export class UserListMembershipsV2Paginator extends ListTimelineV2Paginator<ListTimelineV2Result, GetListTimelineV2Params, { id: string }> {
  protected _endpoint = 'users/:id/list_memberships';
}

export class UserListFollowedV2Paginator extends ListTimelineV2Paginator<ListTimelineV2Result, GetListTimelineV2Params, { id: string }> {
  protected _endpoint = 'users/:id/followed_lists';
}
