/**
 * Narrows a Mongoose ref field's static type (typically `ObjectId | null`)
 * to the shape it actually has at runtime after `.populate()`. Mongoose's
 * own typings don't track populate() calls, so without this the only
 * alternatives at a read site are `as any` (accepts any property access,
 * typos included) or a bespoke interface per call site. Used wherever a
 * populated ref is read back out of a query result.
 */
export type Populated<T, K extends keyof T, D> = Omit<T, K> & Record<K, D>;

/**
 * The common case in this codebase: a populated department/designation ref
 * that was projected down to just `{ name }` via `.select("name")` /
 * `.populate({ select: "name" })`.
 */
export type NameRef = { name: string } | null;
