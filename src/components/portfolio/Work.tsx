import React from 'react';
import type { Project } from '../../data/portfolioContent';
import { ProjectThumb } from './Thumbnails';
import { PROFILE_DEFAULTS, pick, type Profile } from '../../data/profile';

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="card flat" style={{ padding: 28, textAlign: 'center', borderStyle: 'dashed' }}>
      <p className="eyebrow" style={{ marginBottom: 10 }}>
        Coming soon
      </p>
      <h3 className="display" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', margin: '0 0 10px' }}>
        {title}
      </h3>
      <p style={{ margin: 0, color: 'var(--ink-soft)' }}>{body}</p>
    </div>
  );
}

export function WorkCard({ project, onClick, i }: { project: Project; onClick: () => void; i: number }) {
  return (
    <div
      className="work-card"
      onClick={onClick}
      onMouseEnter={() => document.body.classList.add('cursor-hot')}
      onMouseLeave={() => document.body.classList.remove('cursor-hot')}
    >
      <div className="work-corner">
        <span className={`pill ${project.accent}`}>{project.year}</span>
      </div>
      <div className="work-thumb">
        <ProjectThumb id={project.id} media={project.media} />
      </div>
      <div className="work-meta">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
          <div className="work-title">{project.title}</div>
          <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--muted)' }}>0{i + 1}</div>
        </div>
        <p className="work-desc">{project.desc}</p>
        <div className="work-tags">{project.tags.map((t) => <span key={t} className="tag">{t}</span>)}</div>
      </div>
    </div>
  );
}

export function WorkPage({
  go,
  openProject,
  kind,
  projects,
  profile = null,
}: {
  go: (id: string) => void;
  openProject: (p: Project) => void;
  kind: 'web' | 'games';
  projects: Project[];
  profile?: Profile | null;
}) {
  const title = kind === 'web' ? 'Web design' : 'Game dev';
  const num = kind === 'web' ? '02' : '03';
  const sub =
    kind === 'web'
      ? pick(profile?.intros.web, PROFILE_DEFAULTS.intros.web)
      : pick(profile?.intros.games, PROFILE_DEFAULTS.intros.games);
  return (
    <section className="section page">
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="section-num">
              {num} / {kind}
            </div>
            <h2 className="section-title display">{title}</h2>
            <p style={{ maxWidth: 540, color: 'var(--ink-soft)', margin: '14px 0 0' }}>{sub}</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className="pill">{projects.length} projects</span>
            <button className="nav-link" onClick={() => go(kind === 'web' ? 'games' : 'web')}>
              → see {kind === 'web' ? 'games' : 'web'}
            </button>
          </div>
        </div>
        {projects.length > 0 ? (
          <div className="work-grid">
            {projects.map((p, i) => (
              <WorkCard key={p.id} project={p} onClick={() => openProject(p)} i={i} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={kind === 'web' ? 'No web projects... yet' : 'No games... yet'}
            body={
              kind === 'web'
                ? 'You scrolled all this way and got an empty grid. Bold. Come back after there is something to click.'
                : 'You found the secret level where the games should be. Congrats. It is mostly air for now.'
            }
          />
        )}
      </div>
    </section>
  );
}

export function FeaturedWork({
  openProject,
  go,
  webProjects: web,
  gameProjects: games,
}: {
  openProject: (p: Project) => void;
  go: (id: string) => void;
  webProjects: Project[];
  gameProjects: Project[];
}) {
  const featured = [...web.slice(0, 2), ...games.slice(0, 2)];
  return (
    <section className="section wrap">
      <div className="section-head">
        <div>
          <div className="section-num">02 / selected</div>
          <h2 className="section-title display">Selected work</h2>
          <p style={{ maxWidth: 540, color: 'var(--ink-soft)', margin: '14px 0 0' }}>
            A mix of recent web and games. More on each sub-page.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="nav-link active" onClick={() => go('web')}>
            → Web work
          </button>
          <button className="nav-link" onClick={() => go('games')}>
            → Games
          </button>
        </div>
      </div>
      {featured.length > 0 ? (
        <div className="work-grid">
          {featured.map((p, i) => (
            <WorkCard key={p.id} project={p} onClick={() => openProject(p)} i={i} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Featured work is on coffee break"
          body="You arrived early. Pretend this empty section is an exclusive behind-the-scenes preview."
        />
      )}
    </section>
  );
}
