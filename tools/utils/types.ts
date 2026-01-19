export type MaybeLiteral<T extends string> = (string & {}) | T;
