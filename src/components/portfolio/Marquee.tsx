import React from 'react';
import { PROFILE_DEFAULTS, pick, type Profile } from '../../data/profile';

export function MarqueeStrip({ profile = null }: { profile?: Profile | null }) {
  const items = pick(profile?.marqueeItems, PROFILE_DEFAULTS.marqueeItems);
  const full = [...items, ...items];
  return (
    <div className="marquee">
      <div className="marquee-track">
        {full.map((it, i) => (
          <span key={i}>
            <span>{it}</span>
            <span className="dot" />
          </span>
        ))}
      </div>
    </div>
  );
}
