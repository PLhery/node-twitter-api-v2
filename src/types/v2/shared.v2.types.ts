import type { InlineErrorV2 } from '../errors.types';

export type MetaV2<M> = { meta: M, errors?: InlineErrorV2[] };
export type DataV2<D> = { data: D, errors?: InlineErrorV2[] };
export type IncludeV2<I> = { includes?: I, errors?: InlineErrorV2[] };

export type DataAndMetaV2<D, M> = { data: D, meta: M, errors?: InlineErrorV2[] };
export type DataAndIncludeV2<D, I> = { data: D, includes?: I, errors?: InlineErrorV2[] };
export type DataMetaAndIncludeV2<D, M, I> = { data: D, meta: M, includes?: I, errors?: InlineErrorV2[] };

export interface SentMeta {
  /** The time when the request body was returned. */
  sent: string;
}

export interface PaginableCountMetaV2 {
  result_count: number;
  next_token?: string;
  previous_token?: string;
}
