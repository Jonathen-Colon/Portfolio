import DOMPurify from "dompurify";

/** Escape plain text for inserting into a single HTML paragraph. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Legacy Convex/static content: one string per paragraph. */
export function paragraphsToHtml(paragraphs: string[]): string {
  if (paragraphs.length === 0) return "<p></p>";
  return paragraphs
    .map((t) => {
      const inner = escapeHtml(t).replace(/\n/g, "<br />");
      return `<p>${inner}</p>`;
    })
    .join("");
}

const HTML_TAG_RE = /<\s*\/?\s*(p|br|strong|b|em|i|s|strike|a|ul|ol|li|h[1-3]|blockquote|pre|code|img|span)(\s[^>]*)?\/?>/i;

/**
 * Paragraph arrays. Older saves split editor HTML into string[] chunks that still contain
 * inline markup (<strong>, <a>, <img>, lists); treat those chunks as HTML (sanitized later)
 * instead of escaping them. Plain-text paragraphs are still escaped.
 */
function legacyParagraphsToHtml(paragraphs: string[]): string {
  if (!paragraphs.some((t) => HTML_TAG_RE.test(t))) return paragraphsToHtml(paragraphs);
  return paragraphs
    .map((t) => (HTML_TAG_RE.test(t) ? (/^\s*<(ul|ol|h[1-3]|blockquote|pre|img)\b/i.test(t) ? t : `<p>${t}</p>`) : `<p>${escapeHtml(t).replace(/\n/g, "<br />")}</p>`))
    .join("");
}

export function bodyToHtmlForEditor(body: string[] | string | undefined): string {
  if (body === undefined || body === null) return "<p></p>";
  if (typeof body === "string") {
    const t = body.trim();
    return t ? body : "<p></p>";
  }
  return legacyParagraphsToHtml(body);
}

function isEmptyBodyHtml(html: string): boolean {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const text = doc.body.textContent?.replace(/\u00a0/g, " ").trim() ?? "";
  const hasImg = doc.body.querySelector("img");
  return !text && !hasImg;
}

/**
 * Normalizes editor HTML for Convex. Always stores non-empty rich content as an HTML string
 * so inline marks (bold, links, …) inside paragraphs are preserved. Empty editor → `[]`.
 * Legacy `string[]` in the DB is still read via `bodyToHtmlForEditor` / `bodyToDisplayHtml`.
 */
export function editorHtmlToStorageBody(html: string): string[] | string {
  const trimmed = html.trim();
  if (!trimmed || isEmptyBodyHtml(trimmed)) return [];
  return sanitizePortfolioBodyHtml(trimmed);
}

const SANITIZE: DOMPurify.Config = {
  ALLOWED_TAGS: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "s",
    "strike",
    "a",
    "ul",
    "ol",
    "li",
    "h1",
    "h2",
    "h3",
    "blockquote",
    "pre",
    "code",
    "img",
    "span",
  ],
  ALLOWED_ATTR: ["href", "src", "alt", "title", "target", "rel", "class"],
  ALLOW_DATA_ATTR: false,
};

export function sanitizePortfolioBodyHtml(html: string): string {
  return DOMPurify.sanitize(html, SANITIZE);
}

/**
 * HTML for dangerouslySetInnerHTML in modals.
 * `string[]` is treated as plain paragraphs (no inline HTML). `string` is full rich HTML from the admin editor.
 */
export function bodyToDisplayHtml(body: string[] | string | undefined): string {
  if (body === undefined || body === null) return "";
  const raw = typeof body === "string" ? body : legacyParagraphsToHtml(body);
  return sanitizePortfolioBodyHtml(raw);
}
