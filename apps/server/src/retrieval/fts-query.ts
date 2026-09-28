// Quoted tokens keep FTS5 syntax and keywords (AND, OR, NOT, NEAR) out of the query.
export function ftsQuery(text: string) {
  const tokens = text.match(/[\p{L}\p{M}\p{N}]+/gu);
  return tokens ? tokens.map((token) => `"${token}"`).join(" OR ") : null;
}
