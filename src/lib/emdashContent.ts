/**
 * Server-only: loads portfolio content from EmDash and maps it onto the
 * shapes the React UI renders. Called by each Astro page at request time,
 * so a published edit shows up on the next page load.
 */
import { getEmDashCollection, getEmDashEntry } from "emdash";
import { toHTML, uriLooksSafe } from "@portabletext/to-html";
import type { Post, Project } from "../data/portfolioContent";
import type { Profile } from "../data/profile";

type Media =
  | { src?: string; url?: string; alt?: string; provider?: string; filename?: string; meta?: { storageKey?: string } }
  | null
  | undefined;

/** Turns a storage key into a public URL (Astro.locals.emdash.getPublicMediaUrl). */
type MediaResolver = (storageKey: string) => string;

let resolveKey: MediaResolver = (key) => `/_emdash/api/media/file/${key}`;

/** Local media values carry a storage key, not a URL; external ones keep their src. */
function mediaSrc(m: Media): string | undefined {
  if (!m) return undefined;
  if (m.provider !== "external" && m.meta?.storageKey) return resolveKey(m.meta.storageKey);
  return m.src || m.url || undefined;
}

const escapeAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/** Portable Text -> HTML string. The modals sanitize it again with DOMPurify before display. */
function portableToHtml(value: unknown): string {
  if (!Array.isArray(value) || value.length === 0) return "";
  return toHTML(value as never, {
    components: {
      types: {
        image: ({ value: v }: { value: { asset?: Media; alt?: string } & NonNullable<Media> }) => {
          const src = mediaSrc(v.asset) ?? mediaSrc(v);
          return src ? `<img src="${escapeAttr(src)}" alt="${escapeAttr(v.alt ?? v.asset?.alt ?? "")}" />` : "";
        },
      },
      marks: {
        link: ({ children, value: v }: { children: string; value?: { href?: string } }) => {
          const href = v?.href ?? "";
          return uriLooksSafe(href) ? `<a href="${escapeAttr(href)}">${children}</a>` : children;
        },
      },
    },
    onMissingComponent: false,
  });
}

/** "2026-04-01T…" -> "2026-04", matching the original devlog date style. */
function yearMonth(d: unknown): string {
  const date = d instanceof Date ? d : typeof d === "string" ? new Date(d) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export type PortfolioContent = {
  webProjects: Project[];
  gameProjects: Project[];
  posts: Post[];
  profile: Profile | null;
};

export async function loadPortfolioContent(resolveMedia?: MediaResolver): Promise<PortfolioContent> {
  if (resolveMedia) resolveKey = resolveMedia;
  const [projectsRes, postsRes, profileRes] = await Promise.all([
    getEmDashCollection("projects", { orderBy: { sort_order: "asc", created_at: "asc" } }),
    getEmDashCollection("posts", { orderBy: { posted_on: "desc" } }),
    getEmDashEntry("profile", "profile"),
  ]);
  for (const res of [projectsRes, postsRes, profileRes]) {
    if (res.error) console.error("[emdash] content query failed:", res.error);
  }

  const projects: Project[] = projectsRes.entries.map((e) => {
    const d = e.data as Record<string, any>;
    return {
      id: e.id,
      title: d.title ?? "",
      year: d.year ?? "",
      kind: d.kind ?? "web",
      role: d.role ?? "",
      desc: d.summary ?? "",
      tags: (d.tags ?? []).map((t: { label?: string }) => t.label ?? "").filter(Boolean),
      accent: d.accent ?? "cobalt",
      thumb: e.id,
      live: d.live || undefined,
      repo: d.repo || undefined,
      itch: d.itch || undefined,
      media: mediaSrc(d.thumbnail),
      body: portableToHtml(d.body),
    };
  });

  const posts: Post[] = postsRes.entries.map((e) => {
    const d = e.data as Record<string, any>;
    return {
      id: e.id,
      date: yearMonth(d.posted_on),
      title: d.title ?? "",
      excerpt: d.excerpt ?? "",
      read: d.read_time ?? "",
      tag: d.tag ?? "Devlog",
      thumb: (d.tag ?? "devlog").toLowerCase(),
      body: portableToHtml(d.body),
    };
  });

  const p = profileRes.entry?.data as Record<string, any> | undefined;
  const rows = (list: any[] | undefined) =>
    (list ?? []).map((r) => ({ title: r.title ?? "", org: r.org ?? "", year: r.years ?? "", tag: r.tag || undefined }));
  const profile: Profile | null = p
    ? {
        name: p.name ?? "",
        availability: p.availability ?? "",
        location: p.location ?? "",
        heroPhrases: (p.hero_phrases ?? []).map((x: { text?: string }) => x.text ?? "").filter(Boolean),
        aboutIntro: p.about_intro ?? "",
        aboutFacts: (p.about_facts ?? []).map((f: { label?: string; value?: string }) => ({ label: f.label ?? "", value: f.value ?? "" })),
        portraitUrl: mediaSrc(p.portrait) ?? null,
        ctaEyebrow: p.cta_eyebrow ?? "",
        ctaBody: p.cta_body ?? "",
        resume: {
          work: rows(p.resume_work),
          education: rows(p.resume_education),
          skills: (p.skills ?? []).map((s: { name?: string }) => s.name ?? "").filter(Boolean),
        },
        resumePdfUrl: mediaSrc(p.resume_pdf) ?? null,
        resumePdfFilename: (p.resume_pdf as Media)?.filename ?? "resume.pdf",
        heroTagline: p.hero_tagline ?? "",
        marqueeItems: (p.marquee_items ?? []).map((x: { text?: string }) => x.text ?? "").filter(Boolean),
        intros: {
          web: p.intro_web ?? "",
          games: p.intro_games ?? "",
          devlog: p.intro_devlog ?? "",
          contact: p.intro_contact ?? "",
        },
        contactEmail: p.contact_email ?? "",
        contactNotes: String(p.contact_notes ?? "").split("\n").map((l) => l.trim()).filter(Boolean),
        socialLinks: (p.social_links ?? [])
          .map((l: { label?: string; handle?: string; url?: string }) => ({ label: l.label ?? "", handle: l.handle ?? "", url: l.url ?? "" }))
          .filter((l: { label: string; url: string }) => l.label && l.url),
        footerHeadline: p.footer_headline ?? "",
        footerNote: p.footer_note ?? "",
      }
    : null;

  return {
    webProjects: projects.filter((x) => x.kind === "web"),
    gameProjects: projects.filter((x) => x.kind === "game"),
    posts,
    profile,
  };
}
