export const BUCKET_LIST_CLOCK = Symbol('BUCKET_LIST_CLOCK');

export interface BucketListClock {
  now(): Date;
}
