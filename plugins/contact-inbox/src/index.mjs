// @ts-check
/**
 * Contact inbox — EmDash native plugin.
 *
 * - `submit` (public): the site's contact form posts here; entries are stored in plugin storage.
 * - `list` / `update` (admin only): power the Inbox page in the EmDash admin.
 */
import { definePlugin } from "emdash";
import { z } from "zod";

const ID = "contact-inbox";
const VERSION = "0.1.0";
const ENTRY = "portfolio-contact-inbox";
const ADMIN_ENTRY = "portfolio-contact-inbox/admin";

export const KINDS = /** @type {const} */ ([
  "Project inquiry",
  "Game dev collab",
  "Speaking / interview",
  "Just saying hi",
  "Something else",
]);

/** Max submissions per window, per IP address and per email address. */
const RATE_LIMIT = { max: 5, windowMs: 60 * 60 * 1000 };

const submitInput = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().toLowerCase().email().max(254),
  kind: z.enum(KINDS),
  body: z.string().trim().min(1).max(5000),
  // Honeypot: hidden from people, filled in by most bots.
  website: z.string().max(500).optional(),
});

const listInput = z.object({
  view: z.enum(["inbox", "archived"]).default("inbox"),
  cursor: z.string().optional(),
});

const updateInput = z
  .object({
    id: z.string().min(1).max(100),
    done: z.boolean().optional(),
    archived: z.boolean().optional(),
  })
  .refine((v) => v.done !== undefined || v.archived !== undefined, { message: "Nothing to update" });

/**
 * Counts one submission against a rate-limit key. Returns false when the key is over the limit.
 * @param {import("emdash").PluginContext} ctx
 * @param {string} key
 */
async function allow(ctx, key) {
  const now = Date.now();
  for (let attempt = 0; attempt < 3; attempt++) {
    const current = await ctx.kv.getVersioned(key);
    /** @type {{ start: number; count: number }} */
    const prev = /** @type {any} */ (current?.value) ?? { start: now, count: 0 };
    const fresh = now - prev.start > RATE_LIMIT.windowMs;
    const next = fresh ? { start: now, count: 1 } : { start: prev.start, count: prev.count + 1 };
    if (next.count > RATE_LIMIT.max) return false;
    const res = await ctx.kv.compareAndSet(key, current?.revision ?? null, next);
    if (res.applied) return true;
  }
  return false;
}

/** Build-time descriptor, registered in astro.config.mjs. */
export function contactInbox() {
  return {
    id: ID,
    version: VERSION,
    format: /** @type {const} */ ("native"),
    entrypoint: ENTRY,
    adminEntry: ADMIN_ENTRY,
  };
}

/** Runtime plugin, imported by EmDash by name. */
export function createPlugin() {
  return definePlugin({
    id: ID,
    version: VERSION,
    storage: {
      submissions: {
        indexes: ["createdAt", "archived", ["archived", "createdAt"]],
      },
    },
    admin: {
      entry: ADMIN_ENTRY,
      pages: [{ path: "/inbox", label: "Contact inbox", icon: "envelope-simple" }],
      widgets: [{ id: "inbox-summary", title: "Contact inbox" }],
    },
    routes: {
      submit: {
        public: true,
        methods: ["POST"],
        handler: async (ctx) => {
          const parsed = submitInput.safeParse(ctx.input);
          if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };
          const { website, ...form } = parsed.data;
          // Pretend success to bots so they don't retry.
          if (website) return { ok: true };

          const ip = ctx.requestMeta?.ip;
          if ((ip && !(await allow(ctx, `rate:ip:${ip}`))) || !(await allow(ctx, `rate:email:${form.email}`))) {
            return { ok: false, error: "RATE_LIMITED" };
          }

          const createdAt = new Date().toISOString();
          await ctx.storage.submissions.put(`sub_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`, {
            ...form,
            createdAt,
            done: false,
            archived: false,
          });
          return { ok: true };
        },
      },

      list: {
        methods: ["GET"],
        handler: async (ctx) => {
          const parsed = listInput.safeParse(ctx.input ?? {});
          if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };
          const { view, cursor } = parsed.data;
          const archived = view === "archived";
          const [page, inboxCount, archivedCount] = await Promise.all([
            ctx.storage.submissions.query({
              where: { archived },
              orderBy: { createdAt: "desc" },
              limit: 100,
              cursor,
            }),
            ctx.storage.submissions.count({ archived: false }),
            ctx.storage.submissions.count({ archived: true }),
          ]);
          const openCount = (
            await ctx.storage.submissions.query({ where: { archived: false }, limit: 100 })
          ).items.filter((i) => !(/** @type {any} */ (i.data).done)).length;
          return {
            ok: true,
            items: page.items.map((i) => ({ id: i.id, ...(/** @type {object} */ (i.data)) })),
            cursor: page.cursor ?? null,
            counts: { inbox: inboxCount, archived: archivedCount, open: openCount },
          };
        },
      },

      update: {
        methods: ["POST"],
        handler: async (ctx) => {
          const parsed = updateInput.safeParse(ctx.input);
          if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };
          const { id, done, archived } = parsed.data;
          const now = new Date().toISOString();
          /** @type {Record<string, unknown>} */
          const set = {};
          if (done !== undefined) Object.assign(set, { done, doneAt: done ? now : null });
          if (archived !== undefined) Object.assign(set, { archived, archivedAt: archived ? now : null });
          const res = await ctx.storage.submissions.updateIf(id, { where: {}, set });
          if (!res.applied) return { ok: false, error: "NOT_FOUND" };
          return { ok: true, item: { id, ...(/** @type {object} */ (res.data)) } };
        },
      },
    },
  });
}
