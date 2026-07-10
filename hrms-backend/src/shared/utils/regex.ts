// Escapes regex metacharacters in user-supplied search text before it's
// interpolated into a `new RegExp(...)` pattern for a MongoDB query.
// Without this, a crafted search string can either match unintended
// documents (e.g. "." matching any character) or, with nested quantifiers,
// trigger catastrophic backtracking (ReDoS) against the query engine.
export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
