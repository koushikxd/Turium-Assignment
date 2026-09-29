const STOPWORDS = new Set(
  `a an the and or of to in on at for with by from about
  is are was were be been am do does did have has had can would should could
  i me my you your we our it its this that what when where which who how why
  s t d m ll re ve`.split(/\s+/),
);

// Quoted tokens keep FTS5 syntax and keywords (AND, OR, NOT, NEAR) out of the query.
export function ftsQuery(text: string) {
  const tokens = (text.match(/[\p{L}\p{M}\p{N}]+/gu) ?? []).filter(
    (token) => !STOPWORDS.has(token.toLowerCase()),
  );
  return tokens.length > 0 ? tokens.map((token) => `"${token}"`).join(" OR ") : null;
}
