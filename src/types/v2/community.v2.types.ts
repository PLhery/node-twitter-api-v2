export interface CommunityRuleV2 {
  /** Identifier of the rule. */
  id: string;
  /** Text of the rule. */
  text: string;
  /** Creation date of the rule. */
  created_at?: string;
}

export interface CommunityV2 {
  id: string;
  name: string;
  /** Description of the community. */
  description?: string;
  /** Identifier of the community creator. */
  creator_id?: string;
  created_at: string;
  /** Indicates if the community is private. */
  private?: boolean;
  /** Number of members in the community. */
  member_count?: number;
  /** Number of moderators in the community. */
  moderator_count?: number;
  /** Number of subscribers of the community. */
  subscriber_count?: number;
  /** Rules that apply to the community. */
  rules?: CommunityRuleV2[];
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