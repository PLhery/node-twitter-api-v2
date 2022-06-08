import { TweetV1TimelineParams } from './tweet.v1.types';
import { UserV1 } from './user.v1.types';

export interface ListV1 {
  id: number;
  id_str: string;
  slug: string;
  name: string;
  full_name: string;
  created_at: string;
  description: string;
  uri: string;
  subscriber_count: number;
  member_count: number;
  mode: 'public' | 'private';
  user: UserV1;
}


// PARAMS

type TUserOrScreenName = { user_id: string } | { screen_name: string };

export type ListListsV1Params = Partial<TUserOrScreenName> & { reverse?: boolean };

export interface GetListV1Params {
  list_id?: string;
  slug?: string;
  owner_screen_name?: string;
  owner_id?: string;
}

export interface ListMemberShowV1Params extends GetListV1Params {
  include_entities?: boolean;
  skip_status?: boolean;
  user_id?: string;
  screen_name?: string;
  tweet_mode?: 'compat' | 'extended';
}

export interface ListMembersV1Params extends GetListV1Params {
  count?: number;
  cursor?: string;
  include_entities?: boolean;
  skip_status?: boolean;
  tweet_mode?: 'compat' | 'extended';
}

export interface ListOwnershipsV1Params {
  user_id?: string;
  screen_name?: string;
  count?: number;
  cursor?: string;
  include_entities?: boolean;
  skip_status?: boolean;
  tweet_mode?: 'compat' | 'extended';
}

export type ListSubscriptionsV1Params = ListOwnershipsV1Params;

export interface ListMembershipsV1Params extends ListOwnershipsV1Params {
  filter_to_owned_lists?: boolean;
}

export interface ListStatusesV1Params extends TweetV1TimelineParams, GetListV1Params {
  include_rts?: boolean;
}

export interface ListFavoritesV1Params {
  user_id?: string;
  screen_name?: string;
  count?: number;
  since_id?: string;
  max_id?: string;
  include_entities?: boolean;
}

export interface ListCreateV1Params {
  name: string;
  mode?: 'public' | 'private';
  description?: string;
  tweet_mode?: 'compat' | 'extended';
}

export interface AddOrRemoveListMembersV1Params extends GetListV1Params {
  user_id?: string | string[];
  screen_name?: string | string[];
}

export interface UpdateListV1Params extends Partial<ListCreateV1Params>, GetListV1Params {}

// RESULTS

export interface DoubleEndedListsCursorV1Result {
  next_cursor?: string;
  next_cursor_str?: string;
  previous_cursor?: string;
  previous_cursor_str?: string;
  lists: ListV1[];
}

export interface DoubleEndedUsersCursorV1Result {
  next_cursor?: string;
  next_cursor_str?: string;
  previous_cursor?: string;
  previous_cursor_str?: string;
  users: UserV1[];
}
