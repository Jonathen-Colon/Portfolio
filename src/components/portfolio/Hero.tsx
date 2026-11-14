import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PROFILE_DEFAULTS, pick, type Profile } from '../../data/profile';

const DEFAULT_PHRASES = ['interactive prototypes!', 'devlogs & games!', 'chunky websites!', 'things that click!', 'pixel art at 2 a.m.!'];

function HeroBackdrop() {
  return (
    <svg viewBox="0 0 400 460" style={{ width: '100%', height: 'auto', opacity: 0.9 }}>
      <defs>
        <pattern id="dots-bg" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.5" fill="#141414" />
        </pattern>
      </defs>
      <circle cx="280" cy="120" r="85" fill="#C8FF4D" stroke="#141414" strokeWidth="2.5" />
      <rect x="60" y="240" width="140" height="140" rx="20" fill="#FF3B1F" stroke="#141414" strokeWidth="2.5" transform="rotate(-8 130 310)" />
      <polygon points="260,280 370,280 370,400 260,400" fill="url(#dots-bg)" stroke="#141414" strokeWidth="2.5" />
      <path d="M 40 110 Q 140 20 240 110 T 440 110" stroke="#141414" strokeWidth="3" fill="none" />
    </svg>
  );
}

export function Hero({
  go,
  webProjectCount,
  gameProjectCount,
  postCount,
  profile = null,
}: {
  go: (id: string) => void;
  webProjectCount: number;
  gameProjectCount: number;
  postCount: number;
  profile?: Profile | null;
}) {
  const phrases = useMemo(
    () => (profile?.heroPhrases.length ? profile.heroPhrases : DEFAULT_PHRASES),
    [profile]
  );
  const longestPhrase = useMemo(
    () => phrases.reduce((a, b) => (a.length >= b.length ? a : b), phrases[0] ?? ''),
    [phrases]
  );
  const [idx, setIdx] = useState(0);
  const [sub, setSub] = useState('');
  const [phase, setPhase] = useState<'typing' | 'deleting'>('typing');
  const parallaxRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const current = phrases[idx];
    let t: ReturnType<typeof setTimeout>;
    if (phase === 'typing') {
      if (sub.length < current.length) {
        t = setTimeout(() => setSub(current.slice(0, sub.length + 1)), 55);
      } else {
        t = setTimeout(() => setPhase('deleting'), 1600);
      }
    } else {
      if (sub.length > 0) {
        t = setTimeout(() => setSub(current.slice(0, sub.length - 1)), 28);
      } else {
        setIdx((idx + 1) % phrases.length);
        setPhase('typing');
      }
    }
    return () => clearTimeout(t);
  }, [sub, phase, idx, phrases]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      const el = parallaxRef.current;
      if (!el) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const x = (e.clientX / w - 0.5) * 2;
      const y = (e.clientY / h - 0.5) * 2;
      el.style.setProperty('--px', String(x));
      el.style.setProperty('--py', String(y));
    }
    window.addEventListener('mousemove', handle);
    return () => window.removeEventListener('mousemove', handle);
  }, []);

  return (
    <section className="hero wrap" ref={parallaxRef}>
      <div
        className="hero-backdrop"
        style={{
          position: 'absolute',
          inset: '40px 28px 40px auto',
          width: 360,
          pointerEvents: 'none',
          transform: 'translate(calc(var(--px, 0) * -12px), calc(var(--py, 0) * -8px))',
          transition: 'transform 120ms linear',
          zIndex: 0,
        }}
      >
        <HeroBackdrop />
      </div>
      <div className="hero-grid" style={{ position: 'relative', zIndex: 1 }}>
        <div>
          <div className="hero-kicker">
            <span className="pill red">
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 99,
                  background: '#fff',
                  display: 'inline-block',
                  boxShadow: '0 0 0 2px #141414',
                }}
              />{' '}
              {profile?.availability || 'Available May'}
            </span>
            <span className="pill">{pick(profile?.location, PROFILE_DEFAULTS.location)}</span>
          </div>
          <h1 className="hero-title display">
            <span className="word">Jon</span> <span className="word accent">Colon</span>
            <br />
            <span className="word outline">makes</span> <span className="word">stuff.</span>
          </h1>
          <p className="hero-sub">
            {pick(profile?.heroTagline, PROFILE_DEFAULTS.heroTagline)} Currently making{' '}
            <span className="hero-typing-slot">
              <span className="typing typing-measure" aria-hidden="true">
                {longestPhrase}
              </span>
              <span className="typing typing-live">{sub}</span>
            </span>
          </p>
          <div className="hero-ctas">
            <button className="btn" onClick={() => go('web')}>
              See the work <span>→</span>
            </button>
            <button className="btn btn-ghost" onClick={() => go('contact')}>
              Say hi
            </button>
          </div>
        </div>
        <div className="hero-side">
          <div className="stat-card lime">
            <div>
              <div className="stat-k">{webProjectCount}</div>
              <div className="stat-v">Web projects</div>
            </div>
            <div style={{ fontSize: 38 }}>✷</div>
          </div>
          <div className="stat-card cobalt">
            <div>
              <div className="stat-k">{gameProjectCount}</div>
              <div className="stat-v">Games</div>
            </div>
            <div style={{ fontSize: 38 }}>◐</div>
          </div>
          <div className="stat-card sun">
            <div>
              <div className="stat-k">{postCount}</div>
              <div className="stat-v">Devlog posts</div>
            </div>
            <div style={{ fontSize: 38 }}>❡</div>
          </div>
        </div>
      </div>
    </section>
  );
}
