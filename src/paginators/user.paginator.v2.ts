import { UserV2, UserV2TimelineParams, UserV2TimelineResult } from '../types';
import { TimelineV2Paginator } from './v2.paginator';

/** A generic PreviousableTwitterPaginator able to consume UserV2 timelines. */
abstract class UserTimelineV2Paginator<
  TResult extends UserV2TimelineResult,
  TParams extends UserV2TimelineParams,
  TShared = any,
> extends TimelineV2Paginator<TResult, TParams, UserV2, TShared> {
  protected getItemArray() {
    return this.users;
  }

  /**
   * Users returned by paginator.
   */
  get users() {
    return this._realData.data ?? [];
  }
}

export class UserBlockingUsersV2Paginator extends UserTimelineV2Paginator<UserV2TimelineResult, UserV2TimelineParams, { id: string }> {
  protected _endpoint = 'users/:id/blocking';
}

export class UserMutingUsersV2Paginator extends UserTimelineV2Paginator<UserV2TimelineResult, UserV2TimelineParams, { id: string }> {
  protected _endpoint = 'users/:id/muting';
}

export class UserFollowersV2Paginator extends UserTimelineV2Paginator<UserV2TimelineResult, UserV2TimelineParams, { id: string }> {
  protected _endpoint = 'users/:id/followers';
}

export class UserFollowingV2Paginator extends UserTimelineV2Paginator<UserV2TimelineResult, UserV2TimelineParams, { id: string }> {
  protected _endpoint = 'users/:id/following';
}

export class UserListMembersV2Paginator extends UserTimelineV2Paginator<UserV2TimelineResult, UserV2TimelineParams, { id: string }> {
  protected _endpoint = 'lists/:id/members';
}

export class UserListFollowersV2Paginator extends UserTimelineV2Paginator<UserV2TimelineResult, UserV2TimelineParams, { id: string }> {
  protected _endpoint = 'lists/:id/followers';
}
