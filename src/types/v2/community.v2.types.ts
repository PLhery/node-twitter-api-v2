export type CommunityJoinPolicy =
  | 'Open'
  | 'RestrictedJoinRequestsDisabled'
  | 'RestrictedJoinRequestsRequireAdminApproval'
  | 'RestrictedJoinRequestsRequireModeratorApproval'
  | 'SuperFollowRequired';

export interface CommunityV2 {
  id: string;
  name: string;
  created_at: string;
  description?: string;
  access?: 'Public' | 'Closed';
  join_policy?: CommunityJoinPolicy;
  member_count?: number;
}

export interface CommunityErrorV2 {
    title: string;
    type: string;
    detail?: string;
    status?: number;
}

export interface CommunityV2Result {
  data: CommunityV2;
  errors?: CommunityErrorV2[];
}

export interface CommunitiesV2Result {
  data: CommunityV2[];
  errors?: CommunityErrorV2[];
  meta: {next_token?: string};
}

export interface CommunityByIDV2Params {
  id: string;
}

export interface CommunitySearchV2Params {
  query: string;
  max_results?: number;
  next_token?: string;
  pagination_token?: string;
}
