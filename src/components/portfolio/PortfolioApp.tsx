import React, { useState, useEffect, useRef, useCallback } from 'react';
import { resume as resumeContent } from '../../data/portfolio';
import type { Post, Project } from '../../data/portfolioContent';
import type { Profile } from '../../data/profile';
import { sitePageTitle } from '../../data/sitePages';
import { useFinePointer, useNeedClickNavMenu } from './hooks';
import {
  NAV_ABOUT_IDS,
  NAV_ABOUT_ITEMS,
  NAV_WORK_IDS,
  NAV_WORK_ITEMS,
  PAGES,
  pageToPath,
  pathToPage,
} from './routes';
import { HomeRoute } from './Home';
import { WorkPage } from './Work';
import { BlogPage } from './Blog';
import { AboutPage } from './About';
import { ContactPage, type ContactFormInput } from './Contact';
import { ResumePage } from './Resume';
import { ProjectModal, PostModal } from './Modals';
import { Footer } from './Footer';

export type PortfolioAppProps = {
  initialPage?: string;
  webProjects?: Project[];
  gameProjects?: Project[];
  posts?: Post[];
  onSubmitContact?: (input: ContactFormInput) => Promise<void>;
  resumePdfUrl?: string | null;
  resumePdfFilename?: string;
  profile?: Profile | null;
};

export default function PortfolioApp({
  initialPage = 'home',
  webProjects: webProjectsProp,
  gameProjects: gameProjectsProp,
  posts: postsProp,
  onSubmitContact,
  resumePdfUrl = null,
  resumePdfFilename = 'resume.pdf',
  profile = null,
}: PortfolioAppProps) {
  const webProjects = webProjectsProp ?? [];
  const gameProjects = gameProjectsProp ?? [];
  const posts = postsProp ?? [];
  const [page, setPage] = useState<string>(() => {
    if (typeof window !== 'undefined') return pathToPage(window.location.pathname);
    return PAGES.some((p) => p.id === initialPage) ? initialPage : 'home';
  });
  const [theme, setTheme] = useState<string>(() => {
    try {
      return localStorage.getItem('jc-theme') || 'light';
    } catch {
      return 'light';
    }
  });
  const [curtain, setCurtain] = useState<{ on: boolean; label: string }>({ on: false, label: '' });
  const [modalProject, setModalProject] = useState<Project | null>(null);
  const [modalPost, setModalPost] = useState<Post | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<'work' | 'about' | null>(null);
  const [hoverMenusDismissed, setHoverMenusDismissed] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  const finePointer = useFinePointer();
  const needClickNavMenu = useNeedClickNavMenu();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('jc-theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    if (!finePointer) {
      document.documentElement.removeAttribute('data-jc-cursor');
      return;
    }
    document.documentElement.setAttribute('data-jc-cursor', 'custom');
    return () => document.documentElement.removeAttribute('data-jc-cursor');
  }, [finePointer]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [page]);

  useEffect(() => {
    function onPopState() {
      setPage(pathToPage(window.location.pathname));
      setOpenMenu(null);
      setHoverMenusDismissed(false);
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (navRef.current?.contains(e.target as Node)) return;
      setOpenMenu(null);
      setHoverMenusDismissed(true);
      setMobileOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      setOpenMenu(null);
      setHoverMenusDismissed(true);
      setMobileOpen(false);
    }
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const go = useCallback(
    (id: string) => {
      if (id === page) return;
      const label = PAGES.find((p) => p.id === id)?.label || '';
      const nextPath = pageToPath(id);
      if (typeof window !== 'undefined' && window.location.pathname !== nextPath) {
        window.history.pushState({ page: id }, '', nextPath);
      }
      setCurtain({ on: true, label });
      setMobileOpen(false);
      setOpenMenu(null);
      setHoverMenusDismissed(false);
      setTimeout(() => {
        setPage(id);
        if (typeof document !== 'undefined') {
          document.title = sitePageTitle(id);
        }
      }, 380);
      setTimeout(() => setCurtain({ on: false, label: '' }), 820);
    },
    [page]
  );

  useEffect(() => {
    if (!finePointer) return;
    let rx = window.innerWidth / 2,
      ry = window.innerHeight / 2;
    let tx = rx,
      ty = ry;
    let raf: number;
    function mm(e: MouseEvent) {
      tx = e.clientX;
      ty = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.left = tx + 'px';
        dotRef.current.style.top = ty + 'px';
      }
    }
    function tick() {
      rx += (tx - rx) * 0.18;
      ry += (ty - ry) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.left = rx + 'px';
        ringRef.current.style.top = ry + 'px';
      }
      raf = requestAnimationFrame(tick);
    }
    window.addEventListener('mousemove', mm);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', mm);
      cancelAnimationFrame(raf);
    };
  }, [finePointer]);

  return (
    <>
      {finePointer && (
        <>
          <div ref={dotRef} className="cursor-dot" />
          <div ref={ringRef} className="cursor-ring" />
        </>
      )}

      {curtain.on && (
        <div className="curtain sweep">
          <div className="curtain-label">{curtain.label}</div>
        </div>
      )}

      <nav
        ref={navRef}
        className={`nav${hoverMenusDismissed ? ' nav-dropdown-hover-dismissed' : ''}`}
        onMouseEnter={() => setHoverMenusDismissed(false)}
      >
        <div className="nav-inner">
          <a
            className="logo"
            href={pageToPath('home')}
            onClick={(e) => {
              e.preventDefault();
              go('home');
            }}
            style={{ cursor: 'pointer' }}
          >
            <span className="logo-badge">JC</span>
            <span>
              joncolon<span style={{ color: 'var(--red)' }}>.dev</span>
            </span>
          </a>
          <div className="nav-end">
            <div className={`nav-links${mobileOpen ? ' open' : ''}`}>
              <div className={`nav-drop${needClickNavMenu && openMenu === 'work' ? ' open' : ''}`}>
                <button
                  type="button"
                  className={`nav-drop-trigger nav-link${NAV_WORK_IDS.has(page) ? ' active' : ''}`}
                  aria-expanded={needClickNavMenu ? openMenu === 'work' : undefined}
                  aria-haspopup="true"
                  onClick={() => {
                    if (!needClickNavMenu) return;
                    setOpenMenu((m) => (m === 'work' ? null : 'work'));
                  }}
                >
                  Work
                  <span className="nav-drop-caret" aria-hidden>
                    ▾
                  </span>
                </button>
                <div className="nav-drop-panel" role="menu">
                  {NAV_WORK_ITEMS.map((item) => (
                    <a
                      key={item.id}
                      role="menuitem"
                      href={pageToPath(item.id)}
                      className={`nav-drop-link${page === item.id ? ' active' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        go(item.id);
                      }}
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>
              <div className={`nav-drop${needClickNavMenu && openMenu === 'about' ? ' open' : ''}`}>
                <button
                  type="button"
                  className={`nav-drop-trigger nav-link${NAV_ABOUT_IDS.has(page) ? ' active' : ''}`}
                  aria-expanded={needClickNavMenu ? openMenu === 'about' : undefined}
                  aria-haspopup="true"
                  onClick={() => {
                    if (!needClickNavMenu) return;
                    setOpenMenu((m) => (m === 'about' ? null : 'about'));
                  }}
                >
                  About
                  <span className="nav-drop-caret" aria-hidden>
                    ▾
                  </span>
                </button>
                <div className="nav-drop-panel" role="menu">
                  {NAV_ABOUT_ITEMS.map((item) => (
                    <a
                      key={item.id}
                      role="menuitem"
                      href={pageToPath(item.id)}
                      className={`nav-drop-link${page === item.id ? ' active' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        go(item.id);
                      }}
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
            <div className="nav-controls">
              <button className="theme-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} title="Toggle theme">
                {theme === 'light' ? '☾' : '☀'}
              </button>
              <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? '✕' : '≡'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {page === 'home' && (
        <HomeRoute
          go={go}
          openProject={setModalProject}
          openPost={setModalPost}
          webProjects={webProjects}
          gameProjects={gameProjects}
          posts={posts}
          profile={profile}
        />
      )}
      {page === 'web' && (
        <div key="web">
          <WorkPage kind="web" go={go} openProject={setModalProject} projects={webProjects} profile={profile} />
        </div>
      )}
      {page === 'games' && (
        <div key="games">
          <WorkPage kind="games" go={go} openProject={setModalProject} projects={gameProjects} profile={profile} />
        </div>
      )}
      {page === 'blog' && (
        <div key="blog">
          <BlogPage openPost={setModalPost} posts={posts} profile={profile} />
        </div>
      )}
      {page === 'about' && (
        <div key="about">
          <AboutPage profile={profile} />
        </div>
      )}
      {page === 'contact' && (
        <div key="contact">
          <ContactPage onSubmitContact={onSubmitContact} profile={profile} />
        </div>
      )}
      {page === 'resume' && (
        <div key="resume">
          <ResumePage resume={profile?.resume ?? resumeContent} resumePdfUrl={resumePdfUrl} resumePdfFilename={resumePdfFilename} />
        </div>
      )}

      <Footer go={go} profile={profile} />

      {modalProject && <ProjectModal project={modalProject} onClose={() => setModalProject(null)} />}
      {modalPost && <PostModal post={modalPost} onClose={() => setModalPost(null)} />}
    </>
  );
}
