export type DataAndMeta<D, M> = { data: D[], meta: M };
export type Meta<M> = { meta: M };

export interface SentMeta {
  /** The time when the request body was returned. */
  sent: string;
}
