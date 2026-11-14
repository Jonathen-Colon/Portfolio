import type { Resume } from "./portfolio";

/** Editable profile copy (EmDash `profile` collection, single entry). */
export interface Profile {
  name: string;
  availability: string;
  location: string;
  heroPhrases: string[];
  aboutIntro: string;
  aboutFacts: { label: string; value: string }[];
  portraitUrl: string | null;
  ctaEyebrow: string;
  ctaBody: string;
  resume: Resume;
  resumePdfUrl: string | null;
  resumePdfFilename: string;
  heroTagline: string;
  marqueeItems: string[];
  intros: { web: string; games: string; devlog: string; contact: string };
  contactEmail: string;
  contactNotes: string[];
  socialLinks: { label: string; handle: string; url: string }[];
  footerHeadline: string;
  footerNote: string;
}

/** Fallback copy used if the profile entry is missing or a field is left empty. */
export const PROFILE_DEFAULTS = {
  heroTagline: 'Designer, developer and part-time game dev.',
  marqueeItems: ['Available May 2026', 'Interactive prototypes', 'Web design', 'Indie games', 'Design systems', 'Southern MA', 'Taking clients'],
  intros: {
    web: 'Sites, products, marketing pages. Half for clients, half for the fun of it.',
    games: 'Small weird games I make in my off-hours. Two shipped, two in progress.',
    devlog: "Short posts about what I'm making and why. Unfiltered.",
    contact: 'Best for project inquiries. I reply within a day or two.',
  },
  contactEmail: 'jonathen@joncolon.dev',
  contactNotes: ['Booking May 2026 onward.', 'Pacific & Eastern times both fine.', 'Prefer async over meetings.'],
  socialLinks: [
    { label: 'X / Twitter', handle: '@oobijohnson', url: 'https://x.com/oobijohnson' },
    { label: 'GitHub', handle: 'Jonathen-Colon', url: 'https://github.com/Jonathen-Colon' },
    { label: 'LinkedIn', handle: 'in/jonathen-colon', url: 'https://www.linkedin.com/in/jonathen-colon-51956789/' },
  ],
  footerHeadline: 'Making stuff\nsince 2018.',
  footerNote: 'Hand-built with Astro, React and a lot of coffee',
  location: 'Southern MA',
};

/** Profile value, or its default when the profile or the field is empty. */
export function pick<T>(value: T | undefined | null, fallback: T): T {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'string' && !value.trim()) return fallback;
  if (Array.isArray(value) && value.length === 0) return fallback;
  return value;
}
