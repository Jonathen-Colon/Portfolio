import type { ReactElement } from 'react';
import type { Post } from '../../data/portfolioContent';

// ─── PRNG ─────────────────────────────────────────────────────────────────────

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Project thumb SVGs ───────────────────────────────────────────────────────

function ThumbAtlas() {
  return (
    <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%', display: 'block' }}>
      <rect width="400" height="250" fill="#FF3B1F" />
      {[...Array(14)].map((_, i) => (
        <path key={i} d={`M-20 ${40 + i * 20} Q 120 ${20 + i * 15} 220 ${60 + i * 18} T 420 ${40 + i * 20}`} stroke="#141414" strokeWidth="1.5" fill="none" opacity={i % 3 === 0 ? 1 : 0.4} />
      ))}
      <circle cx="280" cy="130" r="6" fill="#141414" />
      <circle cx="280" cy="130" r="14" fill="none" stroke="#141414" strokeWidth="2" />
      <text x="296" y="134" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="#141414" fontWeight="700">43.4°N</text>
    </svg>
  );
}

function ThumbField() {
  return (
    <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%', display: 'block' }}>
      <rect width="400" height="250" fill="#2E4BFF" />
      <rect x="40" y="30" width="320" height="200" fill="#F4EFE6" stroke="#141414" strokeWidth="2" rx="6" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x="60" y={60 + i * 24} width={i === 0 ? 220 : i === 3 ? 180 : 260} height="10" fill="#141414" opacity={i === 0 ? 1 : 0.35} rx="2" />
      ))}
      <circle cx="335" cy="50" r="6" fill="#C8FF4D" stroke="#141414" strokeWidth="2" />
    </svg>
  );
}

function ThumbBodega() {
  return (
    <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%', display: 'block' }}>
      <rect width="400" height="250" fill="#FFC83D" />
      <g transform="translate(200,140)">
        {[30, 60, 90, 120, 150].map((r, i) => (
          <circle key={r} r={r} fill="none" stroke="#141414" strokeWidth="2.5" opacity={1 - i * 0.12} />
        ))}
        <circle r="14" fill="#FF3B1F" stroke="#141414" strokeWidth="2" />
      </g>
      <text x="30" y="40" fontFamily="Bricolage Grotesque, sans-serif" fontWeight="800" fontSize="22" fill="#141414">ON AIR</text>
      <circle cx="110" cy="32" r="6" fill="#FF3B1F" />
    </svg>
  );
}

function ThumbParcel() {
  return (
    <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%', display: 'block' }}>
      <rect width="400" height="250" fill="#C8FF4D" />
      <path d="M 30 200 Q 110 80 200 140 T 370 60" stroke="#141414" strokeWidth="3" fill="none" strokeDasharray="1 10" strokeLinecap="round" />
      <rect x="20" y="190" width="24" height="24" fill="#141414" rx="4" />
      <polygon points="360,50 380,70 360,70" fill="#FF3B1F" stroke="#141414" strokeWidth="2" />
      <circle cx="200" cy="140" r="10" fill="#F4EFE6" stroke="#141414" strokeWidth="2" />
      <text x="30" y="40" fontFamily="JetBrains Mono, monospace" fontSize="10" fontWeight="700" fill="#141414">ROUTE 01 · 14 STOPS</text>
    </svg>
  );
}

function ThumbMoth() {
  const rand = mulberry32(42);
  const stars = [...Array(90)].map(() => ({ x: rand() * 400, y: rand() * 250, r: rand() * 1.8 + 0.3 }));
  return (
    <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%', display: 'block' }}>
      <rect width="400" height="250" fill="#6B2BFF" />
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#F4EFE6" />
      ))}
      <g stroke="#FFC83D" strokeWidth="1.5" fill="#FFC83D">
        <line x1="120" y1="80" x2="160" y2="120" />
        <line x1="160" y1="120" x2="220" y2="100" />
        <line x1="220" y1="100" x2="260" y2="150" />
        <line x1="260" y1="150" x2="310" y2="120" />
        <circle cx="120" cy="80" r="3" />
        <circle cx="160" cy="120" r="3" />
        <circle cx="220" cy="100" r="3" />
        <circle cx="260" cy="150" r="3" />
        <circle cx="310" cy="120" r="3" />
      </g>
      <g transform="translate(180,180)">
        <ellipse cx="-8" cy="-4" rx="14" ry="8" fill="#F4EFE6" stroke="#141414" strokeWidth="1.5" transform="rotate(-20)" />
        <ellipse cx="8" cy="-4" rx="14" ry="8" fill="#F4EFE6" stroke="#141414" strokeWidth="1.5" transform="rotate(20)" />
        <ellipse cx="0" cy="0" rx="3" ry="10" fill="#141414" />
      </g>
    </svg>
  );
}

function ThumbRewind() {
  return (
    <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%', display: 'block' }}>
      <rect width="400" height="250" fill="#FF3B1F" />
      <rect x="20" y="20" width="150" height="14" fill="#141414" />
      <rect x="22" y="22" width="110" height="10" fill="#C8FF4D" />
      <rect x="230" y="20" width="150" height="14" fill="#141414" />
      <rect x="232" y="22" width="80" height="10" fill="#F4EFE6" />
      <rect x="90" y="140" width="30" height="70" fill="#141414" />
      <rect x="280" y="130" width="30" height="80" fill="#F4EFE6" stroke="#141414" strokeWidth="2" opacity="0.6" />
      <rect x="260" y="130" width="30" height="80" fill="#F4EFE6" stroke="#141414" strokeWidth="2" strokeDasharray="3 3" />
      <text x="200" y="130" textAnchor="middle" fontFamily="Bricolage Grotesque, sans-serif" fontWeight="800" fontSize="52" fill="#141414" letterSpacing="-2">REWIND</text>
      <text x="200" y="70" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fontWeight="700" fill="#141414">T-4.8s</text>
    </svg>
  );
}

function ThumbLattice() {
  return (
    <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%', display: 'block' }}>
      <rect width="400" height="250" fill="#4DE0B2" />
      <polygon points="140,80 260,80 300,150 200,200 100,150" fill="#F4EFE6" stroke="#141414" strokeWidth="2.5" opacity="0.8" />
      <polygon points="200,80 200,200 300,150" fill="#141414" opacity="0.08" />
      <line x1="0" y1="125" x2="140" y2="125" stroke="#FF3B1F" strokeWidth="3" />
      <line x1="140" y1="125" x2="260" y2="85" stroke="#FF3B1F" strokeWidth="3" />
      <line x1="260" y1="85" x2="260" y2="80" stroke="#FF3B1F" strokeWidth="3" />
      <line x1="260" y1="85" x2="400" y2="160" stroke="#FFC83D" strokeWidth="3" />
      <line x1="260" y1="85" x2="400" y2="40" stroke="#6B2BFF" strokeWidth="3" />
    </svg>
  );
}

function ThumbThicket() {
  const rand = mulberry32(7);
  return (
    <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%', display: 'block' }}>
      <rect width="400" height="250" fill="#2E4BFF" />
      {[...Array(18)].map((_, i) => {
        const x = rand() * 400;
        const y = 120 + rand() * 100;
        const s = 14 + rand() * 24;
        return (
          <g key={i} transform={`translate(${x},${y})`}>
            <rect x="-2" y="0" width="4" height={s * 0.4} fill="#141414" />
            <circle cx="0" cy="-4" r={s * 0.5} fill="#C8FF4D" stroke="#141414" strokeWidth="1.5" />
          </g>
        );
      })}
      <text x="20" y="40" fontFamily="JetBrains Mono, monospace" fontSize="9" fontWeight="700" fill="#F4EFE6">TREE #247 · AGE 43 · LIGHTNING x2</text>
    </svg>
  );
}

const THUMB_MAP: Record<string, () => ReactElement> = {
  atlas: ThumbAtlas,
  field: ThumbField,
  bodega: ThumbBodega,
  parcel: ThumbParcel,
  moth: ThumbMoth,
  rewind: ThumbRewind,
  lattice: ThumbLattice,
  thicket: ThumbThicket,
};

/** Absolute URL for <img src>; add https:// when there is no scheme (e.g. admin-pasted domains). */
function mediaImageSrc(raw: string | undefined): string | null {
  const t = raw?.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t) || t.startsWith('/')) return t;
  return `https://${t}`;
}

export function ProjectThumb({ id, media }: { id: string; media?: string }) {
  const src = mediaImageSrc(media);
  if (src) {
    return (
      <img
        src={src}
        alt=""
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    );
  }
  const Component = THUMB_MAP[id];
  if (!Component) return <div className="th cobalt-solid" style={{ width: '100%', height: '100%' }} />;
  return <Component />;
}

export function ThumbPost({ post }: { post: Post }) {
  const bg: Record<string, string> = { Devlog: '#6B2BFF', Design: '#FF3B1F', Code: '#2E4BFF', Meta: '#C8FF4D' };
  const fg: Record<string, string> = { Devlog: '#F4EFE6', Design: '#F4EFE6', Code: '#F4EFE6', Meta: '#141414' };
  const bgColor = bg[post.tag] || '#141414';
  const fgColor = fg[post.tag] || '#F4EFE6';
  return (
    <svg viewBox="0 0 400 230" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%', display: 'block' }}>
      <rect width="400" height="230" fill={bgColor} />
      <text x="20" y="45" fontFamily="JetBrains Mono, monospace" fontSize="10" fontWeight="700" fill={fgColor} letterSpacing="2">
        {post.tag.toUpperCase()}
      </text>
      <text x="20" y="130" fontFamily="Bricolage Grotesque, sans-serif" fontWeight="800" fontSize="42" fill={fgColor} letterSpacing="-1.5">
        <tspan x="20" dy="0">#</tspan>
        <tspan x="54">{post.id.slice(0, 3).toUpperCase()}</tspan>
      </text>
      <text x="20" y="210" fontFamily="JetBrains Mono, monospace" fontSize="11" fill={fgColor}>
        {post.date}
      </text>
    </svg>
  );
}
