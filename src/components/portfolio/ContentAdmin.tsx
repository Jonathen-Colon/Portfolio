import { ConvexAuthProvider, useAuthActions } from "@convex-dev/auth/react";
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { normalizeBody } from "../../../convex/lib/normalizeBody";
import type { Post, Project } from "../../data/portfolioContent";
import { convexClient, hasConvex } from "../../lib/convexClient";
import { AdminRichBodyEditor } from "./AdminRichBodyEditor";
import { ProjectThumb } from "./Thumbnails";

type AdminTab = "posts" | "projects" | "contacts" | "resume";

const NAV: { id: AdminTab; label: string; kicker: string; blurb: string; accent: string }[] = [
  { id: "posts", label: "Posts", kicker: "Writing", blurb: "Devlog entries that publish on the site.", accent: "lime" },
  { id: "projects", label: "Projects", kicker: "Selected work", blurb: "Web and game pieces, plus the story behind them.", accent: "cobalt" },
  { id: "contacts", label: "Inbox", kicker: "Messages", blurb: "Notes sent through the contact form.", accent: "sun" },
  { id: "resume", label: "Resume", kicker: "Document", blurb: "The PDF linked from the resume page.", accent: "mint" },
];

const ACCENTS = ["red", "lime", "cobalt", "plum", "sun", "mint"] as const;

function tagsToDraft(tags: string[] | undefined): string {
  return (tags ?? []).join(", ");
}

function draftToTags(s: string): string[] {
  return s
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function formatAuthError(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}

function matchesQuery(query: string, ...parts: Array<string | undefined>): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return parts.some((part) => (part ?? "").toLowerCase().includes(needle));
}

function initials(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("");
  return letters.toUpperCase() || "•";
}

function kindAccent(kind: string): string {
  if (kind.startsWith("Project")) return "cobalt";
  if (kind.startsWith("Game")) return "plum";
  if (kind.startsWith("Speaking")) return "sun";
  if (kind.startsWith("Just")) return "mint";
  return "red";
}

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatWhen(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Field({ label, children, span = false }: { label: string; children: ReactNode; span?: boolean }) {
  return (
    <div className={span ? "form-field studio-span" : "form-field"}>
      <label>{label}</label>
      {children}
    </div>
  );
}

function StudioMark({ large = false }: { large?: boolean }) {
  return <span className={large ? "studio-mark is-lg" : "studio-mark"}>JC</span>;
}

function RailIcon({ name }: { name: AdminTab | "out" }) {
  const props = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  if (name === "posts") {
    return (
      <svg {...props}>
        <path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
        <path d="M14 3v6h6M8 13h8M8 17h5" />
      </svg>
    );
  }
  if (name === "projects") {
    return (
      <svg {...props}>
        <rect x="3" y="3" width="8" height="8" rx="1.5" />
        <rect x="13" y="3" width="8" height="8" rx="1.5" />
        <rect x="3" y="13" width="8" height="8" rx="1.5" />
        <rect x="13" y="13" width="8" height="8" rx="1.5" />
      </svg>
    );
  }
  if (name === "contacts") {
    return (
      <svg {...props}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7l9 7 9-7" />
      </svg>
    );
  }
  if (name === "resume") {
    return (
      <svg {...props}>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <circle cx="12" cy="9" r="2" />
        <path d="M8 16c.6-1.4 1.8-2 4-2s3.4.6 4 2" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <path d="M9 6H5a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-4" />
      <path d="M10 14L20 4M14 4h6v6" />
    </svg>
  );
}

function stageMode(open: boolean) {
  return `studio-stage ${open ? "is-reading" : "is-browsing"}`;
}

function DeskBack({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="studio-back" onClick={onClick}>
      <span aria-hidden="true">←</span>
      {label}
    </button>
  );
}

function AdminSignIn() {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const trimmed = email.trim();
    if (!trimmed || !password) {
      setFormError("Enter email and password.");
      return;
    }
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    setPending(true);
    try {
      const result = await signIn("password", {
        flow: "signIn",
        email: trimmed,
        password,
      });
      if (result.redirect) {
        return;
      }
      if (!result.signingIn) {
        setFormError(
          "Could not finish sign-in. If this is a new deployment, set JWT_PRIVATE_KEY and JWKS in the Convex dashboard (run npm run generate:jwt-keys).",
        );
      }
    } catch (err) {
      setFormError(formatAuthError(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="studio-gate">
      <div className="studio-gate-art" aria-hidden="true">
        <span className="studio-blob is-lime" />
        <span className="studio-blob is-cobalt" />
        <span className="studio-blob is-red" />
      </div>
      <div className="studio-gate-copy">
        <StudioMark large />
        <p className="eyebrow">Private desk</p>
        <h1 className="display">The work, edited in private.</h1>
        <a className="studio-text-link" href="/">
          Back to the site
        </a>
      </div>
      <form className="studio-gate-card" onSubmit={(e) => void onSubmit(e)}>
        <span className="studio-sticker">Private</span>
        <p className="eyebrow">Convex Auth</p>
        <h2 className="display">Sign in</h2>
        {formError && <p className="studio-form-error">{formError}</p>}
        <div className="form-field">
          <label htmlFor="auth-email">Email</label>
          <input
            id="auth-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            disabled={pending}
          />
        </div>
        <div className="form-field">
          <label htmlFor="auth-password">Password</label>
          <div className="studio-password">
            <input
              id="auth-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              minLength={8}
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              disabled={pending}
            />
            <button type="button" onClick={() => setShowPassword((v) => !v)} disabled={pending}>
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        <button type="submit" className="btn btn-lime studio-full" disabled={pending}>
          {pending ? "Please wait…" : "Enter the desk"}
        </button>
      </form>
    </div>
  );
}

function AdminWorkspace() {
  const { signOut } = useAuthActions();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const posts = useQuery(api.posts.listPosts, {});
  const projects = useQuery(api.projects.listProjects, {});
  const contacts = useQuery(api.contacts.listContactsAdmin, {});
  const resumePdf = useQuery(api.assets.getResumePdfAdmin, {});
  const upsertPost = useMutation(api.posts.upsertPost);
  const upsertProject = useMutation(api.projects.upsertProject);
  const deletePost = useMutation(api.posts.deletePost);
  const deleteProject = useMutation(api.projects.deleteProject);
  const setContactDone = useMutation(api.contacts.setContactDone);
  const generateResumeUploadUrl = useMutation(api.assets.generateResumeUploadUrl);
  const setResumePdf = useMutation(api.assets.setResumePdf);

  const [tab, setTab] = useState<AdminTab>("posts");
  const [query, setQuery] = useState("");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const sortedPosts = useMemo(() => posts ?? [], [posts]);
  const sortedProjects = useMemo(() => projects ?? [], [projects]);

  const selectedPost = sortedPosts.find((p) => p.id === selectedPostId) ?? null;
  const selectedProject = sortedProjects.find((p) => p.id === selectedProjectId) ?? null;

  const [postForm, setPostForm] = useState<Partial<Post>>({});
  const [projectForm, setProjectForm] = useState<Partial<Project>>({});
  const [projectTagsDraft, setProjectTagsDraft] = useState("");

  useEffect(() => {
    if (!selectedPost) return;
    setPostForm({ ...selectedPost, body: normalizeBody(selectedPost.body as string | string[]) });
  }, [selectedPost]);

  useEffect(() => {
    if (!selectedProject) return;
    setProjectForm({
      ...selectedProject,
      body: normalizeBody(selectedProject.body as string | string[]),
    });
    setProjectTagsDraft(tagsToDraft(selectedProject.tags));
  }, [selectedProject]);

  const syncProjectTagsFromDraft = useCallback((draft: string) => {
    setProjectTagsDraft(draft);
    setProjectForm((f) => ({ ...f, tags: draftToTags(draft) }));
  }, []);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setError(null);
    setMessage(null);
    try {
      await fn();
      setMessage(ok);
    } catch (err) {
      setMessage(null);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const openTab = (next: AdminTab) => {
    setTab(next);
    setQuery("");
    setSelectedPostId(null);
    setPostForm({});
    setSelectedProjectId(null);
    setProjectForm({});
    setProjectTagsDraft("");
    setSelectedContactId(null);
  };

  const deskDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  if (posts === undefined || projects === undefined || contacts === undefined || resumePdf === undefined) {
    return (
      <div className="studio-loading">
        <StudioMark large />
        <p className="eyebrow">Opening the desk…</p>
      </div>
    );
  }

  const section = NAV.find((item) => item.id === tab) ?? NAV[0];
  const openContacts = contacts.filter((entry) => !entry.done);
  const counts: Record<AdminTab, number> = {
    posts: sortedPosts.length,
    projects: sortedProjects.length,
    contacts: openContacts.length,
    resume: resumePdf ? 1 : 0,
  };
  const visiblePosts = sortedPosts.filter((p) => matchesQuery(query, p.title, p.tag, p.date, p.excerpt));
  const visibleProjects = sortedProjects.filter((p) =>
    matchesQuery(query, p.title, p.kind, p.year, p.role, ...(p.tags ?? [])),
  );
  const visibleContacts = contacts.filter(
    (entry) => (showDone || !entry.done) && matchesQuery(query, entry.name, entry.email, entry.kind, entry.body),
  );
  const draftingPost = !selectedPostId && Boolean(postForm.id);
  const draftingProject = !selectedProjectId && Boolean(projectForm.id);
  const postOpen = draftingPost || Boolean(selectedPostId);
  const projectOpen = draftingProject || Boolean(selectedProjectId);
  const selectedContact = contacts.find((entry) => entry._id === selectedContactId) ?? null;
  const reading =
    (tab === "posts" && postOpen) ||
    (tab === "projects" && projectOpen) ||
    (tab === "contacts" && Boolean(selectedContact));

  return (
    <div className={`studio${reading ? " is-reading" : ""}`}>
      <aside className="studio-rail">
        <div className="studio-brand">
          <a href="/" aria-label="View site">
            <StudioMark />
          </a>
        </div>
        <nav className="studio-nav" role="tablist" aria-label="Admin sections">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={tab === item.id}
              aria-controls={`panel-${item.id}`}
              aria-label={`${item.label}, ${counts[item.id]}`}
              title={item.label}
              className={`studio-nav-btn${tab === item.id ? " is-active" : ""}`}
              onClick={() => openTab(item.id)}
            >
              <RailIcon name={item.id} />
              <span className="studio-nav-count">{counts[item.id]}</span>
            </button>
          ))}
        </nav>
        <div className="studio-rail-foot">
          <button type="button" className="studio-signout" aria-label="Sign out" title="Sign out" onClick={() => void signOut()}>
            <RailIcon name="out" />
          </button>
        </div>
      </aside>

      <main className="studio-main">
        <header className="studio-head">
          <div>
            <p className="eyebrow">{section.kicker}</p>
            <h1 className="display">{section.label}</h1>
            <p>{section.blurb}</p>
          </div>
          <p className="studio-date">{deskDate}</p>
        </header>

        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {tab === "posts" && (
            <div className={stageMode(postOpen)}>
              <nav className="studio-list" aria-label="Post list">
                <div className="studio-list-head">
                  <input
                    className="studio-search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search posts"
                    aria-label="Search posts"
                  />
                  <button
                    type="button"
                    className="btn btn-lime studio-list-new"
                    onClick={() => {
                      setSelectedPostId(null);
                      setPostForm({
                        id: `p${String(sortedPosts.length + 1).padStart(3, "0")}`,
                        date: new Date().toISOString().slice(0, 7),
                        title: "",
                        excerpt: "",
                        read: "5 min",
                        tag: "Meta",
                        thumb: "meta",
                        body: [],
                      });
                    }}
                  >
                    New post
                  </button>
                </div>
                <ul className="studio-list-scroll">
                  {draftingPost && (
                    <li>
                      <div className="studio-item is-active is-draft">
                        <span className="studio-item-kicker">Draft</span>
                        <span className="studio-item-title">{postForm.title || "Untitled post"}</span>
                      </div>
                    </li>
                  )}
                  {visiblePosts.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        className={`studio-item${selectedPostId === p.id ? " is-active" : ""}`}
                        onClick={() => setSelectedPostId(p.id)}
                      >
                        <span className="studio-item-kicker">
                          {p.date || "Undated"} · {p.tag || "Untagged"}
                        </span>
                        <span className="studio-item-title">{p.title}</span>
                      </button>
                    </li>
                  ))}
                  {visiblePosts.length === 0 && <li className="studio-list-empty">Nothing matches.</li>}
                </ul>
              </nav>

              <div className="studio-editor">
                {postOpen && (
                  <DeskBack
                    label="All posts"
                    onClick={() => {
                      setSelectedPostId(null);
                      setPostForm({});
                    }}
                  />
                )}
              {!postForm.id && !selectedPostId ? (
                <div className="studio-empty">
                  <span className="studio-empty-index">01</span>
                  <h2 className="display">Pick a post</h2>
                  <p>Or start a fresh one from the list.</p>
                </div>
              ) : (
                <div className="studio-panel">
                  <div className="studio-kicker">
                    <span className="eyebrow">Identity</span>
                  </div>
                  <div className="studio-fields">
                    <Field label="id (slug)">
                      <input
                        value={postForm.id ?? ""}
                        onChange={(e) => setPostForm((f) => ({ ...f, id: e.target.value }))}
                      />
                    </Field>
                    <Field label="date (YYYY-MM)">
                      <input
                        value={postForm.date ?? ""}
                        onChange={(e) => setPostForm((f) => ({ ...f, date: e.target.value }))}
                      />
                    </Field>
                    <Field label="tag">
                      <input
                        value={postForm.tag ?? ""}
                        onChange={(e) => setPostForm((f) => ({ ...f, tag: e.target.value }))}
                      />
                    </Field>
                    <Field label="read">
                      <input
                        value={postForm.read ?? ""}
                        onChange={(e) => setPostForm((f) => ({ ...f, read: e.target.value }))}
                      />
                    </Field>
                    <Field label="thumb" span>
                      <input
                        value={postForm.thumb ?? ""}
                        onChange={(e) => setPostForm((f) => ({ ...f, thumb: e.target.value }))}
                      />
                    </Field>
                  </div>
                  <div className="studio-kicker">
                    <span className="eyebrow">Story</span>
                  </div>
                  <div className="studio-block">
                    <Field label="title">
                      <input
                        value={postForm.title ?? ""}
                        onChange={(e) => setPostForm((f) => ({ ...f, title: e.target.value }))}
                      />
                    </Field>
                    <Field label="excerpt">
                      <textarea
                        value={postForm.excerpt ?? ""}
                        onChange={(e) => setPostForm((f) => ({ ...f, excerpt: e.target.value }))}
                      />
                    </Field>
                    <AdminRichBodyEditor
                      idPrefix="post"
                      body={postForm.body}
                      onChange={(next) => setPostForm((f) => ({ ...f, body: next }))}
                      hint="Bold, lists, links, and images. Images upload to Convex and embed in the article."
                    />
                  </div>
                  <div className="studio-actions">
                    <button
                      type="button"
                      className="btn btn-lime"
                      onClick={() => {
                        const p = postForm as Post;
                        if (!p.id || !p.title) {
                          setError("id and title are required.");
                          return;
                        }
                        void run(
                          () =>
                            upsertPost({
                              post: {
                                id: p.id,
                                date: p.date ?? "",
                                title: p.title,
                                excerpt: p.excerpt ?? "",
                                read: p.read ?? "",
                                tag: p.tag ?? "",
                                thumb: p.thumb ?? "",
                                body: normalizeBody(p.body as string | string[] | undefined),
                              },
                            }),
                          "Post saved.",
                        );
                      }}
                    >
                      Save post
                    </button>
                    {selectedPostId && (
                      <button
                        type="button"
                        className="btn studio-danger"
                        onClick={() => {
                          if (!window.confirm("Delete this post from Convex?")) return;
                          void run(async () => {
                            await deletePost({ id: selectedPostId });
                            setSelectedPostId(null);
                            setPostForm({});
                          }, "Post deleted.");
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              )}
              </div>
            </div>
          )}

          {tab === "projects" && (
            <div className={stageMode(projectOpen)}>
              <nav className="studio-list" aria-label="Project list">
                <div className="studio-list-head">
                  <input
                    className="studio-search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search projects"
                    aria-label="Search projects"
                  />
                  <button
                    type="button"
                    className="btn btn-lime studio-list-new"
                    onClick={() => {
                      setSelectedProjectId(null);
                      setProjectTagsDraft("");
                      setProjectForm({
                        id: "new-project",
                        title: "",
                        year: String(new Date().getFullYear()),
                        kind: "web",
                        role: "",
                        desc: "",
                        tags: [],
                        accent: "cobalt",
                        thumb: "atlas",
                        body: [],
                      });
                    }}
                  >
                    New project
                  </button>
                </div>
                <ul className="studio-list-scroll">
                  {draftingProject && (
                    <li>
                      <div className="studio-item is-active is-draft">
                        <span className="studio-item-kicker">Draft · {projectForm.kind || "web"}</span>
                        <span className="studio-item-title">{projectForm.title || "Untitled project"}</span>
                      </div>
                    </li>
                  )}
                  {visibleProjects.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        className={`studio-item${selectedProjectId === p.id ? " is-active" : ""}`}
                        onClick={() => setSelectedProjectId(p.id)}
                      >
                        <span className="studio-item-kicker">
                          {p.year || "—"} · {p.kind}
                        </span>
                        <span className="studio-item-title">{p.title}</span>
                      </button>
                    </li>
                  ))}
                  {visibleProjects.length === 0 && <li className="studio-list-empty">Nothing matches.</li>}
                </ul>
              </nav>

              <div className="studio-editor">
                {projectOpen && (
                  <DeskBack
                    label="All projects"
                    onClick={() => {
                      setSelectedProjectId(null);
                      setProjectForm({});
                      setProjectTagsDraft("");
                    }}
                  />
                )}
              {!projectForm.id && !selectedProjectId ? (
                <div className="studio-empty">
                  <span className="studio-empty-index">02</span>
                  <h2 className="display">Pick a project</h2>
                  <p>Or draft a new piece from the list.</p>
                </div>
              ) : (
                <div className="studio-panel">
                  <div className="studio-kicker">
                    <span className="eyebrow">Identity</span>
                  </div>
                  <div className="studio-fields">
                    <Field label="id (slug)">
                      <input
                        value={projectForm.id ?? ""}
                        onChange={(e) => setProjectForm((f) => ({ ...f, id: e.target.value }))}
                      />
                    </Field>
                    <Field label="year">
                      <input
                        value={projectForm.year ?? ""}
                        onChange={(e) => setProjectForm((f) => ({ ...f, year: e.target.value }))}
                      />
                    </Field>
                    <Field label="kind">
                      <div className="studio-segment" role="radiogroup" aria-label="Project kind">
                        {(["web", "game"] as const).map((kind) => (
                          <button
                            key={kind}
                            type="button"
                            role="radio"
                            aria-checked={projectForm.kind === kind}
                            className={projectForm.kind === kind ? "is-on" : ""}
                            onClick={() => setProjectForm((f) => ({ ...f, kind }))}
                          >
                            {kind}
                          </button>
                        ))}
                      </div>
                    </Field>
                    <Field label="role">
                      <input
                        value={projectForm.role ?? ""}
                        onChange={(e) => setProjectForm((f) => ({ ...f, role: e.target.value }))}
                      />
                    </Field>
                    <Field label="accent" span>
                      <div className="studio-accent-row">
                        <div className="studio-swatches" role="radiogroup" aria-label="Accent">
                          {ACCENTS.map((name) => (
                            <button
                              key={name}
                              type="button"
                              role="radio"
                              aria-label={name}
                              aria-checked={projectForm.accent === name}
                              className={`studio-swatch is-${name}${projectForm.accent === name ? " is-on" : ""}`}
                              onClick={() => setProjectForm((f) => ({ ...f, accent: name }))}
                            />
                          ))}
                        </div>
                        <input
                          className="studio-accent-input"
                          value={projectForm.accent ?? ""}
                          onChange={(e) => setProjectForm((f) => ({ ...f, accent: e.target.value }))}
                        />
                      </div>
                    </Field>
                    <Field label="thumb" span>
                      <input
                        value={projectForm.thumb ?? ""}
                        onChange={(e) => setProjectForm((f) => ({ ...f, thumb: e.target.value }))}
                      />
                    </Field>
                  </div>

                  <div className="studio-kicker">
                    <span className="eyebrow">Story</span>
                  </div>
                  <div className="studio-block">
                    <Field label="title">
                      <input
                        value={projectForm.title ?? ""}
                        onChange={(e) => setProjectForm((f) => ({ ...f, title: e.target.value }))}
                      />
                    </Field>
                    <Field label="desc">
                      <textarea
                        value={projectForm.desc ?? ""}
                        onChange={(e) => setProjectForm((f) => ({ ...f, desc: e.target.value }))}
                      />
                    </Field>
                    <Field label="tags (comma-separated)">
                      <input value={projectTagsDraft} onChange={(e) => syncProjectTagsFromDraft(e.target.value)} />
                    </Field>
                  </div>

                  <div className="studio-kicker">
                    <span className="eyebrow">On the web</span>
                  </div>
                  <div className="studio-fields">
                    <Field label="live URL">
                      <input
                        value={projectForm.live ?? ""}
                        onChange={(e) => setProjectForm((f) => ({ ...f, live: e.target.value || undefined }))}
                      />
                    </Field>
                    <Field label="repo URL">
                      <input
                        value={projectForm.repo ?? ""}
                        onChange={(e) => setProjectForm((f) => ({ ...f, repo: e.target.value || undefined }))}
                      />
                    </Field>
                    <Field label="itch URL">
                      <input
                        value={projectForm.itch ?? ""}
                        onChange={(e) => setProjectForm((f) => ({ ...f, itch: e.target.value || undefined }))}
                      />
                    </Field>
                    <Field label="media URL">
                      <input
                        value={projectForm.media ?? ""}
                        onChange={(e) => setProjectForm((f) => ({ ...f, media: e.target.value || undefined }))}
                      />
                    </Field>
                    <div className="studio-span studio-preview">
                      <ProjectThumb id={projectForm.id ?? ""} media={projectForm.media} />
                    </div>
                  </div>

                  <AdminRichBodyEditor
                    idPrefix="project"
                    body={projectForm.body}
                    onChange={(next) => setProjectForm((f) => ({ ...f, body: next }))}
                    hint="Bold, lists, links, and images. Images upload to Convex and show in the project modal."
                  />

                  <div className="studio-actions">
                    <button
                      type="button"
                      className="btn btn-lime"
                      onClick={() => {
                        const p = projectForm as Project;
                        if (!p.id || !p.title) {
                          setError("id and title are required.");
                          return;
                        }
                        const payload = {
                          id: p.id,
                          title: p.title,
                          year: p.year ?? "",
                          kind: p.kind,
                          role: p.role ?? "",
                          desc: p.desc ?? "",
                          tags: p.tags ?? [],
                          accent: p.accent ?? "",
                          thumb: p.thumb ?? "",
                          body: normalizeBody(p.body as string | string[] | undefined),
                          live: p.live?.trim() || undefined,
                          repo: p.repo?.trim() || undefined,
                          itch: p.itch?.trim() || undefined,
                          media: p.media?.trim() || undefined,
                          shots: p.shots?.length ? p.shots : undefined,
                        };
                        void run(() => upsertProject({ project: payload }), "Project saved.");
                      }}
                    >
                      Save project
                    </button>
                    {selectedProjectId && (
                      <button
                        type="button"
                        className="btn studio-danger"
                        onClick={() => {
                          if (!window.confirm("Delete this project from Convex?")) return;
                          void run(async () => {
                            await deleteProject({ id: selectedProjectId });
                            setSelectedProjectId(null);
                            setProjectForm({});
                            setProjectTagsDraft("");
                          }, "Project deleted.");
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              )}
              </div>
            </div>
          )}

          {tab === "contacts" && (
            <div className={stageMode(Boolean(selectedContact))}>
              <nav className="studio-list" aria-label="Messages">
                <div className="studio-list-head">
                  <input
                    className="studio-search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search messages"
                    aria-label="Search messages"
                  />
                  <button type="button" className="studio-quiet" onClick={() => setShowDone((value) => !value)}>
                    {showDone ? "Hide completed" : `Completed (${contacts.length - openContacts.length})`}
                  </button>
                </div>
                <ul className="studio-list-scroll">
                  {visibleContacts.map((entry) => (
                    <li key={entry._id}>
                      <button
                        type="button"
                        className={`studio-item${selectedContactId === entry._id ? " is-active" : ""}`}
                        onClick={() => setSelectedContactId(entry._id)}
                      >
                        <span className="studio-item-kicker">
                          {formatWhen(entry.submittedAt)} · {entry.kind}
                          {entry.done ? " · done" : ""}
                        </span>
                        <span className="studio-item-title">{entry.name}</span>
                      </button>
                    </li>
                  ))}
                  {visibleContacts.length === 0 && (
                    <li className="studio-list-empty">{openContacts.length === 0 && !showDone ? "Inbox zero" : "Nothing matches."}</li>
                  )}
                </ul>
              </nav>
              <div className="studio-editor">
                {selectedContact && <DeskBack label="Inbox" onClick={() => setSelectedContactId(null)} />}
                {!selectedContact ? (
                  <div className="studio-empty">
                    <span className="studio-empty-index">00</span>
                    <h2 className="display">Pick a message</h2>
                    <p>Open one to read it, then mark it done to hide it.</p>
                  </div>
                ) : (
                  <article className="studio-panel studio-mail-open">
                    <div className="studio-mail-top">
                      <div>
                        <h2>{selectedContact.name}</h2>
                        <a href={`mailto:${selectedContact.email}`}>{selectedContact.email}</a>
                      </div>
                      <div className="studio-mail-meta">
                        <span className={`pill ${kindAccent(selectedContact.kind)}`}>{selectedContact.kind}</span>
                        <time dateTime={new Date(selectedContact.submittedAt).toISOString()}>
                          {formatWhen(selectedContact.submittedAt)}
                        </time>
                      </div>
                    </div>
                    <p>{selectedContact.body}</p>
                    <div className="studio-actions">
                      <a className="btn btn-ghost" href={`mailto:${selectedContact.email}`}>
                        Reply
                      </a>
                      <button
                        type="button"
                        className="btn btn-lime"
                        onClick={() => {
                          const id = selectedContact._id;
                          const done = !selectedContact.done;
                          void run(async () => {
                            await setContactDone({ id, done });
                            if (done) setSelectedContactId(null);
                          }, done ? "Message hidden." : "Message restored.");
                        }}
                      >
                        {selectedContact.done ? "Restore" : "Done"}
                      </button>
                    </div>
                  </article>
                )}
              </div>
            </div>
          )}

          {tab === "resume" && (
            <div className="studio-resume">
              <label
                className={`studio-drop${dragOver ? " is-over" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (!file) return;
                  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
                  if (!isPdf) {
                    setError("Drop a PDF file.");
                    return;
                  }
                  setError(null);
                  setResumeFile(file);
                }}
              >
                <input
                  id="resume-upload"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                />
                <span className="studio-drop-mark">PDF</span>
                <strong>{resumeFile ? resumeFile.name : "Drop a resume PDF"}</strong>
                <span>{resumeFile ? formatBytes(resumeFile.size) : "or click to browse"}</span>
              </label>
              <div className="studio-panel studio-resume-side">
                <div className="studio-kicker">
                  <span className="eyebrow">Current file</span>
                </div>
                {resumePdf ? (
                  <div className="studio-doc">
                    <div className="resume-title">{resumePdf.filename}</div>
                    <p className="mono">
                      {resumePdf.contentType ?? "application/pdf"}
                      {typeof resumePdf.size === "number" ? ` · ${formatBytes(resumePdf.size)}` : ""}
                      {resumePdf.uploadedAt ? ` · ${formatWhen(resumePdf.uploadedAt)}` : ""}
                    </p>
                    {resumePdf.url ? (
                      <a href={resumePdf.url} className="btn btn-ghost">
                        Open PDF
                      </a>
                    ) : (
                      <p className="mono">File is set, but the URL is unavailable right now.</p>
                    )}
                  </div>
                ) : (
                  <p className="studio-muted">No resume PDF uploaded yet.</p>
                )}
                <button
                  type="button"
                  className="btn btn-lime"
                  disabled={!resumeFile || resumeUploading}
                  onClick={() => {
                    const file = resumeFile;
                    if (!file) {
                      setError("Select a PDF file first.");
                      return;
                    }
                    void run(async () => {
                      setResumeUploading(true);
                      try {
                        const uploadUrl = await generateResumeUploadUrl({});
                        const uploadResult = await fetch(uploadUrl, {
                          method: "POST",
                          headers: {
                            "Content-Type": file.type || "application/pdf",
                          },
                          body: file,
                        });
                        if (!uploadResult.ok) {
                          throw new Error("Failed to upload PDF to Convex storage.");
                        }
                        const payload = (await uploadResult.json()) as { storageId?: string };
                        if (!payload.storageId) {
                          throw new Error("Upload finished but no storageId was returned.");
                        }
                        await setResumePdf({
                          storageId: payload.storageId as Id<"_storage">,
                          filename: file.name,
                          contentType: file.type || undefined,
                          size: file.size,
                        });
                        setResumeFile(null);
                      } finally {
                        setResumeUploading(false);
                      }
                    }, "Resume PDF uploaded.");
                  }}
                >
                  {resumeUploading ? "Uploading…" : "Upload resume PDF"}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {(message || error) && (
        <div className={`studio-toast${error ? " is-error" : " is-ok"}`} role="status">
          <span>{error ?? message}</span>
          <button
            type="button"
            onClick={() => {
              setMessage(null);
              setError(null);
            }}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

function AdminInner() {
  const { isLoading, isAuthenticated } = useConvexAuth();

  if (isLoading) {
    return (
      <div className="studio-loading">
        <StudioMark large />
        <p className="eyebrow">Checking session…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminSignIn />;
  }

  return <AdminWorkspace />;
}

export default function ContentAdmin() {
  if (!hasConvex() || !convexClient) {
    return (
      <div className="studio-gate">
        <div className="studio-gate-copy">
          <StudioMark large />
          <p className="eyebrow">Setup</p>
          <h1 className="display">Convex is not configured.</h1>
          <p>
            Add <code className="mono">PUBLIC_CONVEX_URL</code> to <code className="mono">.env.local</code>, run{" "}
            <code className="mono">npm run convex:dev</code>, then reload this page.
          </p>
          <a className="studio-text-link" href="/">
            Back to the site
          </a>
        </div>
      </div>
    );
  }

  return (
    <ConvexAuthProvider client={convexClient}>
      <AdminInner />
    </ConvexAuthProvider>
  );
}
