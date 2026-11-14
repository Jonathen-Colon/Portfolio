import React from 'react';
import type { Profile } from '../../data/profile';

const DEFAULT_INTRO =
  'I am a Desktop Support Technician and part-time web/game developer. Currently making interactive prototypes, devlogs & games, chunky websites, things that click, and pixel art at 2 a.m.';

const DEFAULT_FACTS = [
  { label: 'Based', value: 'Southern MA' },
  { label: 'Available', value: 'Taking 1-2 new projects starting May' },
  { label: 'Stack', value: 'React, Next.js, Astro, Godot, Unreal, Canva, Aseprite' },
  { label: 'Prefer', value: 'weird briefs, full control' },
  { label: "Don't", value: 'Web3, fintech' },
];

function PortraitIllustration() {
  return (
    <svg viewBox="0 0 320 400" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%', display: 'block' }}>
      <rect width="320" height="400" fill="#FFC83D" />
      <circle cx="60" cy="80" r="30" fill="#FF3B1F" />
      <rect x="240" y="300" width="70" height="70" fill="#2E4BFF" transform="rotate(12 275 335)" />
      <ellipse cx="160" cy="170" rx="70" ry="80" fill="#F4EFE6" stroke="#141414" strokeWidth="2.5" />
      <path d="M 100 140 Q 100 80 160 80 Q 220 80 220 140 Q 220 120 200 115 Q 180 110 160 112 Q 130 114 110 130 Z" fill="#141414" />
      <circle cx="135" cy="170" r="18" fill="none" stroke="#141414" strokeWidth="3" />
      <circle cx="185" cy="170" r="18" fill="none" stroke="#141414" strokeWidth="3" />
      <line x1="153" y1="170" x2="167" y2="170" stroke="#141414" strokeWidth="3" />
      <circle cx="135" cy="170" r="3" fill="#141414" />
      <circle cx="185" cy="170" r="3" fill="#141414" />
      <path d="M 140 205 Q 160 220 180 205" stroke="#141414" strokeWidth="3" fill="none" strokeLinecap="round" />
      <rect x="130" y="240" width="60" height="30" fill="#F4EFE6" stroke="#141414" strokeWidth="2.5" />
      <path d="M 60 280 Q 60 260 100 260 L 220 260 Q 260 260 260 280 L 260 400 L 60 400 Z" fill="#FF3B1F" stroke="#141414" strokeWidth="2.5" />
      <text x="160" y="330" textAnchor="middle" fontFamily="Bricolage Grotesque, sans-serif" fontWeight="800" fontSize="30" fill="#F4EFE6">
        ★
      </text>
      <g transform="translate(240, 100) rotate(10)">
        <circle r="34" fill="#C8FF4D" stroke="#141414" strokeWidth="2" />
        <text textAnchor="middle" y="-2" fontFamily="JetBrains Mono" fontSize="9" fontWeight="700" fill="#141414">
          MAKES
        </text>
        <text textAnchor="middle" y="12" fontFamily="JetBrains Mono" fontSize="9" fontWeight="700" fill="#141414">
          STUFF
        </text>
      </g>
    </svg>
  );
}

export function AboutPage({ profile = null }: { profile?: Profile | null }) {
  const facts = profile?.aboutFacts.length ? profile.aboutFacts : DEFAULT_FACTS;
  return (
    <section className="section page">
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="section-num">05 / about</div>
            <h2 className="section-title display">Hi, I'm Jon.</h2>
          </div>
        </div>
        <div className="about-grid">
          <div>
            <p style={{ fontSize: 20, lineHeight: 1.5, color: 'var(--ink-soft)', marginTop: 0 }}>
              {profile?.aboutIntro || DEFAULT_INTRO}
            </p>
            <div className="fact-list">
              {facts.map((f) => (
                <div key={f.label} className="fact">
                  <div className="fact-k">{f.label}</div>
                  <div className="fact-v">{f.value}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="portrait">
              {profile?.portraitUrl ? (
                <img src={profile.portraitUrl} alt={profile.name || 'Portrait'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <PortraitIllustration />
              )}
            </div>
            <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <span className="pill red">Designer</span>
                <span className="pill cobalt">Developer</span>
                <span className="pill plum">Gamedev</span>
                <span className="pill lime">Pixel art</span>
              </div>
              {!profile?.portraitUrl && (
                <div className="mono" style={{ color: 'var(--muted)', marginTop: 8 }}>
                  Photo coming soon — placeholder for now
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
