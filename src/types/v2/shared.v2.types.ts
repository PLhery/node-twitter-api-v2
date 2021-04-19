import type { ErrorV2 } from '../errors.types';

export type MetaV2<M> = { meta: M, errors?: ErrorV2[] };
export type DataV2<D> = { data: D, errors?: ErrorV2[] };
export type IncludeV2<I> = { includes?: I, errors?: ErrorV2[] };

export type DataAndMetaV2<D, M> = { data: D, meta: M, errors?: ErrorV2[] };
export type DataAndIncludeV2<D, I> = { data: D, includes?: I, errors?: ErrorV2[] };
export type DataMetaAndIncludeV2<D, M, I> = { data: D, meta: M, includes?: I, errors?: ErrorV2[] };

export interface SentMeta {
  /** The time when the request body was returned. */
  sent: string;
}
