import React from 'react';
import type { Post } from '../../data/portfolioContent';
import { ThumbPost } from './Thumbnails';
import { PROFILE_DEFAULTS, pick, type Profile } from '../../data/profile';

function EmptyDevlog({ message }: { message: string }) {
  return (
    <div className="card flat" style={{ padding: 28, textAlign: 'center', borderStyle: 'dashed' }}>
      <p className="eyebrow" style={{ marginBottom: 10 }}>
        Devlog
      </p>
      <h3 className="display" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', margin: '0 0 10px' }}>
        No posts yet, just dramatic silence
      </h3>
      <p style={{ margin: 0, color: 'var(--ink-soft)' }}>{message}</p>
    </div>
  );
}

export function BlogPage({ openPost, posts, profile = null }: { openPost: (p: Post) => void; posts: Post[]; profile?: Profile | null }) {
  return (
    <section className="section page">
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="section-num">04 / devlog</div>
            <h2 className="section-title display">Devlog</h2>
            <p style={{ maxWidth: 540, color: 'var(--ink-soft)', margin: '14px 0 0' }}>
              {pick(profile?.intros.devlog, PROFILE_DEFAULTS.intros.devlog)}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <span className="pill sun">RSS</span>
            <span className="pill">{posts.length} posts</span>
          </div>
        </div>
        {posts.length > 0 ? (
          <div className="devlog">
            {posts.map((p) => (
              <div key={p.id} className="devlog-entry" onClick={() => openPost(p)}>
                <div>
                  <div className="devlog-date">{p.date}</div>
                  <div style={{ marginTop: 6 }}>
                    <span
                      className={`pill ${
                        p.tag === 'Devlog' ? 'plum' : p.tag === 'Design' ? 'red' : p.tag === 'Code' ? 'cobalt' : 'lime'
                      }`}
                    >
                      {p.tag}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="devlog-title">{p.title}</div>
                  <div className="devlog-excerpt">{p.excerpt}</div>
                  <div
                    style={{
                      marginTop: 8,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--muted)',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {p.read} · read →
                  </div>
                </div>
                <div className="devlog-thumb">
                  <ThumbPost post={p} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyDevlog message="You are either very early or very curious. Either way, your reward is this empty page." />
        )}
      </div>
    </section>
  );
}

export function HomeBlogTeaser({ openPost, go, posts }: { openPost: (p: Post) => void; go: (id: string) => void; posts: Post[] }) {
  const teaserPosts = posts.slice(0, 3);
  return (
    <section className="section wrap">
      <div className="section-head">
        <div>
          <div className="section-num">03 / latest</div>
          <h2 className="section-title display">From the devlog</h2>
        </div>
        <button className="nav-link" onClick={() => go('blog')}>
          All posts →
        </button>
      </div>
      {teaserPosts.length > 0 ? (
        <div className="blog-teaser-grid">
          {teaserPosts.map((p) => (
            <article key={p.id} className="card" style={{ cursor: 'pointer' }} onClick={() => openPost(p)}>
              <div style={{ aspectRatio: '16/10', borderBottom: '2px solid var(--line)', overflow: 'hidden' }}>
                <ThumbPost post={p} />
              </div>
              <div className="blog-teaser-body">
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                  <span
                    className={`pill ${
                      p.tag === 'Devlog' ? 'plum' : p.tag === 'Design' ? 'red' : p.tag === 'Code' ? 'cobalt' : 'lime'
                    }`}
                  >
                    {p.tag}
                  </span>
                  <span className="mono" style={{ color: 'var(--muted)' }}>
                    {p.date}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: 24,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.05,
                    marginBottom: 8,
                  }}
                >
                  {p.title}
                </div>
                <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 14 }}>{p.excerpt}</p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyDevlog message="You expected fresh thoughts here. We respect that optimism." />
      )}
    </section>
  );
}
