/**
 * Posts/projects store body as string[] (one paragraph per entry).
 * Accepts a single string: plain multi-line text, or HTML with <p>...</p> blocks.
 */
export function normalizeBody(body: string | string[] | undefined): string[] | string {
  if (body === undefined) return [];
  if (Array.isArray(body)) {
    return body
      .filter((x): x is string => typeof x === "string")
      .map((x) => x.trim())
      .filter(Boolean);
  }
  const s = body.trim();
  if (!s) return [];

  // Rich HTML from the admin TipTap editor: keep it as a single HTML string so inline
  // marks, links, lists and images survive. (Splitting into string[] made the site
  // render it as escaped plain text.) It is sanitized with DOMPurify when displayed.
  if (/<\s*[a-z][a-z0-9]*(?:\s[^>]*)?\/?>/i.test(s)) {
    return s;
  }

  return s
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
