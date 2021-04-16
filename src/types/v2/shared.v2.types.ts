export type MetaV2<M> = { meta: M };
export type DataV2<D> = { data: D };
export type IncludeV2<I> = { includes?: I };

export type DataAndMetaV2<D, M> = DataV2<D> & MetaV2<M>;
export type DataAndIncludeV2<D, I> = DataV2<D> & IncludeV2<I>;
export type DataMetaAndIncludeV2<D, M, I> = DataV2<D> & MetaV2<M> & IncludeV2<I>;

export interface SentMeta {
  /** The time when the request body was returned. */
  sent: string;
}
