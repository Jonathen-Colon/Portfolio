import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireContentAdmin } from "./lib/admin";

const contactKindValue = v.union(
  v.literal("Project inquiry"),
  v.literal("Game dev collab"),
  v.literal("Speaking / interview"),
  v.literal("Just saying hi"),
  v.literal("Something else"),
);

const MAX_NAME = 100;
const MAX_EMAIL = 254;
const MAX_BODY = 5000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_EMAIL_IN_WINDOW = 3;
const MAX_GLOBAL_IN_WINDOW = 50;

export const submitContact = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    kind: contactKindValue,
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    const email = args.email.trim().toLowerCase();
    const body = args.body.trim();
    if (!name || !email || !body) {
      throw new Error("Name, email, and message are required.");
    }
    if (name.length > MAX_NAME || email.length > MAX_EMAIL || body.length > MAX_BODY) {
      throw new Error("One or more fields are too long.");
    }
    if (!EMAIL_RE.test(email)) {
      throw new Error("Please enter a valid email address.");
    }
    const since = Date.now() - RATE_WINDOW_MS;
    const recentForEmail = await ctx.db
      .query("contacts")
      .withIndex("by_email_submitted_at", (q) => q.eq("email", email).gt("submittedAt", since))
      .take(MAX_PER_EMAIL_IN_WINDOW);
    if (recentForEmail.length >= MAX_PER_EMAIL_IN_WINDOW) {
      throw new Error("Too many messages. Please try again later.");
    }
    const recentGlobal = await ctx.db
      .query("contacts")
      .withIndex("by_submitted_at", (q) => q.gt("submittedAt", since))
      .take(MAX_GLOBAL_IN_WINDOW);
    if (recentGlobal.length >= MAX_GLOBAL_IN_WINDOW) {
      throw new Error("Too many messages right now. Please try again later.");
    }
    await ctx.db.insert("contacts", {
      name,
      email,
      kind: args.kind,
      body,
      submittedAt: Date.now(),
    });
    return null;
  },
});

export const listContactsAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requireContentAdmin(ctx);
    return await ctx.db.query("contacts").withIndex("by_submitted_at").order("desc").take(250);
  },
});
