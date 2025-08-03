export type ExcludePropertyKey<
  TKey extends PropertyKey,
  TExclude extends PropertyKey
> = TKey extends TExclude ? never : TKey;

export type Awaitable<T> = T | Promise<T>;

export type IsNever<T> = [T] extends [never] ? true : false;

export type AssertTrue<T extends true> = T;
export type AssertFalse<T extends false> = T;
