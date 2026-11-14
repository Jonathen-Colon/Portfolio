import React from 'react';
import { pageToPath } from './routes';
import { PROFILE_DEFAULTS, pick, type Profile } from '../../data/profile';

export function Footer({ go, profile = null }: { go: (id: string) => void; profile?: Profile | null }) {
  const email = pick(profile?.contactEmail, PROFILE_DEFAULTS.contactEmail);
  const socials = pick(profile?.socialLinks, PROFILE_DEFAULTS.socialLinks);
  const headline = pick(profile?.footerHeadline, PROFILE_DEFAULTS.footerHeadline).split('\n');
  function navLink(pageId: string, label: string) {
    return (
      <a
        href={pageToPath(pageId)}
        onClick={(e) => {
          e.preventDefault();
          go(pageId);
        }}
        style={{ cursor: 'pointer' }}
      >
        {label}
      </a>
    );
  }
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 44, letterSpacing: '-0.03em', lineHeight: 0.95 }}>
              {headline.map((line, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <br />}
                  {line}
                </React.Fragment>
              ))}
            </div>
            <div className="mono" style={{ color: 'var(--muted)', marginTop: 18 }}>
              © {new Date().getFullYear()} {pick(profile?.name, 'Jon Colon')} · {pick(profile?.location, PROFILE_DEFAULTS.location)}
            </div>
          </div>
          <div>
            <h4>Site</h4>
            <ul>
              <li>{navLink('home', 'Home')}</li>
              <li>{navLink('web', 'Web work')}</li>
              <li>{navLink('games', 'Games')}</li>
              <li>{navLink('blog', 'Devlog')}</li>
            </ul>
          </div>
          <div>
            <h4>About</h4>
            <ul>
              <li>{navLink('about', 'Bio')}</li>
              <li>{navLink('resume', 'Resume')}</li>
              <li>{navLink('contact', 'Contact')}</li>
            </ul>
          </div>
          <div>
            <h4>Elsewhere</h4>
            <ul>
              <li>
                <a href={`mailto:${email}`}>Email</a>
              </li>
              {socials.map((l) => (
                <li key={l.url}>
                  <a href={l.url} target="_blank" rel="noreferrer">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>{pick(profile?.footerNote, PROFILE_DEFAULTS.footerNote)}</span>
        </div>
      </div>
    </footer>
  );
}
