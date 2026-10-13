import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  contacts: defineTable({
    name: v.string(),
    email: v.string(),
    kind: v.string(),
    body: v.string(),
    submittedAt: v.number(),
  })
    .index("by_submitted_at", ["submittedAt"])
    .index("by_email_submitted_at", ["email", "submittedAt"]),

  projects: defineTable({
    id: v.string(),
    title: v.string(),
    year: v.string(),
    kind: v.union(v.literal("web"), v.literal("game")),
    role: v.string(),
    desc: v.string(),
    tags: v.array(v.string()),
    accent: v.string(),
    thumb: v.string(),
    live: v.optional(v.string()),
    repo: v.optional(v.string()),
    itch: v.optional(v.string()),
    media: v.optional(v.string()),
    body: v.union(v.array(v.string()), v.string()),
    shots: v.optional(v.array(v.string())),
  })
    .index("by_project_id", ["id"])
    .index("by_kind", ["kind"]),

  posts: defineTable({
    id: v.string(),
    date: v.string(),
    title: v.string(),
    excerpt: v.string(),
    read: v.string(),
    tag: v.string(),
    thumb: v.string(),
    body: v.union(v.array(v.string()), v.string()),
  }).index("by_post_id", ["id"]),

  siteSettings: defineTable({
    key: v.string(),
    resumeFileId: v.optional(v.id("_storage")),
    resumeFileName: v.optional(v.string()),
    resumeContentType: v.optional(v.string()),
    resumeSize: v.optional(v.number()),
    resumeUploadedAt: v.optional(v.number()),
  }).index("by_key", ["key"]),
});
