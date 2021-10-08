import { DataV2 } from './shared.v2.types';

export interface ListCreateV2Params {
  name: string;
  description?: string;
  private?: boolean;
}

export type ListCreateV2Result = DataV2<{ id: string, name: string }>;

export type ListUpdateV2Params = Omit<ListCreateV2Params, 'name'> & { name?: string };

export type ListUpdateV2Result = DataV2<{ updated: true }>;

export type ListDeleteV2Result = DataV2<{ deleted: true }>;

export type ListMemberV2Result = DataV2<{ is_member: boolean }>;

export type ListFollowV2Result = DataV2<{ following: boolean }>;

export type ListPinV2Result = DataV2<{ pinned: boolean }>;
