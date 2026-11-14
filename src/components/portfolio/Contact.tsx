import React, { useState } from 'react';
import { PROFILE_DEFAULTS, pick, type Profile } from '../../data/profile';

export type ContactFormInput = {
  name: string;
  email: string;
  kind: 'Project inquiry' | 'Game dev collab' | 'Speaking / interview' | 'Just saying hi' | 'Something else';
  body: string;
};

const SUBMIT_URL = '/_emdash/api/plugins/contact-inbox/submit';

const SUBMIT_ERRORS: Record<string, string> = {
  INVALID_INPUT: 'Please check your name, email and message and try again.',
  RATE_LIMITED: "You've sent a few messages already. Please try again in an hour, or email me directly.",
};

/** Saves the message to the EmDash contact inbox (plugins/contact-inbox). */
async function postToInbox(input: ContactFormInput & { website: string }) {
  const res = await fetch(SUBMIT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const json = (await res.json().catch(() => null)) as { success?: boolean; data?: { ok?: boolean; error?: string } } | null;
  if (!res.ok || !json?.success || !json.data?.ok) {
    throw new Error(SUBMIT_ERRORS[json?.data?.error ?? ''] ?? 'Could not send message. Please try again, or email me directly.');
  }
}

export function ContactPage({
  onSubmitContact,
  profile = null,
}: {
  onSubmitContact?: (input: ContactFormInput) => Promise<void>;
  profile?: Profile | null;
}) {
  const email = pick(profile?.contactEmail, PROFILE_DEFAULTS.contactEmail);
  const socials = pick(profile?.socialLinks, PROFILE_DEFAULTS.socialLinks);
  const notes = pick(profile?.contactNotes, PROFILE_DEFAULTS.contactNotes);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ContactFormInput>({ name: '', email: '', kind: 'Project inquiry', body: '' });
  const [website, setWebsite] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      if (onSubmitContact) {
        await onSubmitContact(form);
      } else {
        await postToInbox({ ...form, website });
      }
      setSent(true);
      setTimeout(() => setSent(false), 4000);
      setForm({ name: '', email: '', kind: 'Project inquiry', body: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send message. Please try again.');
    } finally {
      setSending(false);
    }
  }
  return (
    <section className="section page">
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="section-num">07 / contact</div>
            <h2 className="section-title display">Let's talk.</h2>
            <p style={{ maxWidth: 540, color: 'var(--ink-soft)', margin: '14px 0 0' }}>
              {pick(profile?.intros.contact, PROFILE_DEFAULTS.intros.contact)}
            </p>
          </div>
        </div>
        <div className="contact-grid">
          <form onSubmit={submit}>
            <div className="form-field">
              <label>Name</label>
              <input required maxLength={200} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" />
            </div>
            <div className="form-field">
              <label>Email</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@somewhere.com"
              />
            </div>
            <div className="form-field">
              <label>What's this about?</label>
              <select
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value as ContactFormInput['kind'] })}
              >
                <option>Project inquiry</option>
                <option>Game dev collab</option>
                <option>Speaking / interview</option>
                <option>Just saying hi</option>
                <option>Something else</option>
              </select>
            </div>
            {/* Honeypot: hidden from people; bots that fill it are dropped server-side. */}
            <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
              <label>
                Website
                <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </label>
            </div>
            <div className="form-field">
              <label>Message</label>
              <textarea
                required
                maxLength={5000}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="Tell me about it. What are you making? What's the weird edge?"
              />
            </div>
            <button className="btn btn-alt" type="submit" disabled={sending}>
              {sending ? 'Sending…' : sent ? "✓ Sent — I'll reply soon" : <>Send message <span>→</span></>}
            </button>
            {error && (
              <p className="mono" style={{ marginTop: 10, color: 'var(--red)' }}>
                {error}
              </p>
            )}
          </form>
          <aside>
            <div className="card contact-aside-card">
              <div className="eyebrow" style={{ marginBottom: 10 }}>
                Direct
              </div>
              <a
                href={`mailto:${email}`}
                style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, letterSpacing: '-0.02em', color: 'inherit' }}
              >
                {email}
              </a>
              <div className="mono" style={{ marginTop: 8, color: 'var(--muted)' }}>
                Copy · opens mail
              </div>
            </div>
            <div className="card contact-aside-card" style={{ background: 'var(--lime)' }}>
              <div className="eyebrow" style={{ marginBottom: 10, color: '#1a1a1a' }}>
                Elsewhere
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                {socials.map((l) => (
                  <a key={l.url} className="nav-link" style={{ justifySelf: 'start', background: '#141414', color: '#F4EFE6' }} href={l.url} target="_blank" rel="noreferrer">
                    {l.label}
                    {l.handle ? ` → ${l.handle}` : ''}
                  </a>
                ))}
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
              {notes.map((n, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <br />}
                  {n}
                </React.Fragment>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
