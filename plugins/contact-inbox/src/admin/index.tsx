import { Badge, Button, Loader, LinkButton } from "@cloudflare/kumo";
import type { PluginAdminExports } from "emdash";
import { apiFetch, parseApiResponse } from "emdash/plugin-utils";
import * as React from "react";

const API = "/_emdash/api/plugins/contact-inbox";

type Submission = {
  id: string;
  name: string;
  email: string;
  kind: string;
  body: string;
  createdAt: string;
  done: boolean;
  archived: boolean;
  doneAt?: string | null;
  archivedAt?: string | null;
};

type ListResult = {
  ok: boolean;
  error?: string;
  items: Submission[];
  cursor: string | null;
  counts: { inbox: number; archived: number; open: number };
};

type View = "inbox" | "archived";

async function loadList(view: View, cursor?: string): Promise<ListResult> {
  const qs = new URLSearchParams({ view });
  if (cursor) qs.set("cursor", cursor);
  const res = await apiFetch(`${API}/list?${qs}`);
  const data = await parseApiResponse<ListResult>(res, "Could not load submissions");
  if (!data.ok) throw new Error(data.error ?? "Could not load submissions");
  return data;
}

async function update(id: string, patch: { done?: boolean; archived?: boolean }) {
  const res = await apiFetch(`${API}/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...patch }),
  });
  const data = await parseApiResponse<{ ok: boolean; error?: string }>(res, "Could not update submission");
  if (!data.ok) throw new Error(data.error ?? "Could not update submission");
}

const dateFmt = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

function mailtoHref(s: Submission) {
  const subject = encodeURIComponent(`Re: ${s.kind}`);
  const quoted = s.body
    .split("\n")
    .map((l) => `> ${l}`)
    .join("\n");
  const body = encodeURIComponent(`Hi ${s.name},\n\n\n\n${quoted}`);
  return `mailto:${s.email}?subject=${subject}&body=${body}`;
}

function SubmissionCard({
  s,
  busy,
  onChange,
}: {
  s: Submission;
  busy: boolean;
  onChange: (patch: { done?: boolean; archived?: boolean }) => void;
}) {
  return (
    <article
      className={`rounded-lg border border-kumo-line bg-kumo-base p-4 shadow-xs ${s.done ? "opacity-70" : ""}`}
      aria-busy={busy}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold">{s.name}</h3>
            {s.done ? <Badge variant="green">Complete</Badge> : <Badge variant="orange">New</Badge>}
            <Badge variant="neutral">{s.kind}</Badge>
          </div>
          <p className="mt-1 text-sm text-kumo-subtle">
            {s.email} · {dateFmt.format(new Date(s.createdAt))}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton href={mailtoHref(s)} variant="primary" size="sm">
            Email {s.name.split(" ")[0]}
          </LinkButton>
          <Button variant="secondary" size="sm" disabled={busy} onClick={() => onChange({ done: !s.done })}>
            {s.done ? "Mark open" : "Mark complete"}
          </Button>
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => onChange({ archived: !s.archived })}>
            {s.archived ? "Restore" : "Archive"}
          </Button>
        </div>
      </header>
      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed">{s.body}</p>
    </article>
  );
}

function InboxPage() {
  const [view, setView] = React.useState<View>("inbox");
  const [data, setData] = React.useState<ListResult>();
  const [error, setError] = React.useState<string>();
  const [busyId, setBusyId] = React.useState<string>();
  const [loadingMore, setLoadingMore] = React.useState(false);

  const load = React.useCallback(async () => {
    setError(undefined);
    try {
      setData(await loadList(view));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [view]);

  React.useEffect(() => {
    setData(undefined);
    void load();
  }, [load]);

  async function change(s: Submission, patch: { done?: boolean; archived?: boolean }) {
    setBusyId(s.id);
    setError(undefined);
    try {
      await update(s.id, patch);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(undefined);
    }
  }

  async function loadMore() {
    if (!data?.cursor) return;
    setLoadingMore(true);
    try {
      const next = await loadList(view, data.cursor);
      setData({ ...next, items: [...data.items, ...next.items] });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingMore(false);
    }
  }

  const counts = data?.counts;
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Contact inbox</h1>
          <p className="text-sm text-kumo-subtle">Messages sent from the contact form on the site.</p>
        </div>
        <div className="flex gap-2" role="tablist" aria-label="Submission views">
          <Button
            role="tab"
            aria-selected={view === "inbox"}
            variant={view === "inbox" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setView("inbox")}
          >
            Inbox{counts ? ` (${counts.inbox})` : ""}
          </Button>
          <Button
            role="tab"
            aria-selected={view === "archived"}
            variant={view === "archived" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setView("archived")}
          >
            Archived{counts ? ` (${counts.archived})` : ""}
          </Button>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-kumo-danger">
          {error}
        </p>
      )}

      {!data && !error ? (
        <Loader />
      ) : data && data.items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-kumo-line p-8 text-center text-kumo-subtle">
          {view === "inbox" ? "No messages. Archived messages are under Archived." : "Nothing archived yet."}
        </p>
      ) : (
        <div className="space-y-3">
          {data?.items.map((s) => (
            <SubmissionCard key={s.id} s={s} busy={busyId === s.id} onChange={(p) => void change(s, p)} />
          ))}
          {data?.cursor && (
            <Button variant="secondary" loading={loadingMore} onClick={() => void loadMore()}>
              Load more
            </Button>
          )}
        </div>
      )}
    </section>
  );
}

function InboxSummaryWidget() {
  const [counts, setCounts] = React.useState<ListResult["counts"]>();
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => {
    loadList("inbox")
      .then((d) => setCounts(d.counts))
      .catch(() => setFailed(true));
  }, []);
  if (failed) return <p className="text-sm text-kumo-subtle">Unavailable</p>;
  if (!counts) return <Loader />;
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm">
        <strong className="text-xl">{counts.open}</strong> new · {counts.inbox} in inbox
      </p>
      <LinkButton href="/_emdash/admin/plugins/contact-inbox/inbox" variant="secondary" size="sm">
        Open inbox
      </LinkButton>
    </div>
  );
}

export const pages: PluginAdminExports["pages"] = {
  "/inbox": InboxPage,
};

export const widgets: PluginAdminExports["widgets"] = {
  "inbox-summary": InboxSummaryWidget,
};
