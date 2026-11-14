import React from 'react';
import type { Post, Project } from '../../data/portfolioContent';
import type { Profile } from '../../data/profile';
import { Hero } from './Hero';
import { MarqueeStrip } from './Marquee';
import { FeaturedWork } from './Work';
import { HomeBlogTeaser } from './Blog';

function HomeCTA({ go, profile }: { go: (id: string) => void; profile: Profile | null }) {
  return (
    <section className="section">
      <div className="wrap">
        <div className="home-cta-panel">
          <div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--red)',
                marginBottom: 14,
              }}
            >
              {profile?.ctaEyebrow || '→ Available May 2026'}
            </div>
            <div className="display" style={{ fontSize: 'clamp(40px, 6vw, 78px)', lineHeight: 0.95, margin: 0 }}>
              Got a weird
              <br />
              brief? <span style={{ color: 'var(--red)' }}>Let's talk.</span>
            </div>
            <p style={{ maxWidth: 520, marginTop: 20, fontSize: 18, opacity: 0.85 }}>
              {profile?.ctaBody || '1-2 slots opening in May. Web, brand, a bit of product. Small teams doing unusual things only.'}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-start' }}>
            <button className="btn btn-alt" onClick={() => go('contact')}>
              Start a project <span>→</span>
            </button>
            <button className="btn btn-ghost" onClick={() => go('resume')}>
              See the resume
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomeRoute({
  go,
  openProject,
  openPost,
  webProjects,
  gameProjects,
  posts,
  profile = null,
}: {
  go: (id: string) => void;
  openProject: (p: Project) => void;
  openPost: (p: Post) => void;
  webProjects: Project[];
  gameProjects: Project[];
  posts: Post[];
  profile?: Profile | null;
}) {
  return (
    <div className="page" key="home">
      <Hero go={go} webProjectCount={webProjects.length} gameProjectCount={gameProjects.length} postCount={posts.length} profile={profile} />
      <MarqueeStrip profile={profile} />
      <FeaturedWork openProject={openProject} go={go} webProjects={webProjects} gameProjects={gameProjects} />
      <HomeBlogTeaser openPost={openPost} go={go} posts={posts} />
      <HomeCTA go={go} profile={profile} />
    </div>
  );
}
