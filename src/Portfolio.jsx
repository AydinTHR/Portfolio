import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Portfolio.css';
import { api } from './lib/api';
import { useContent } from './hooks/useContent';
import ContourBackground from './components/ContourBackground';
import Nav from './components/Nav';
import Hero from './components/Hero';
import About from './components/About';
import Skills from './components/Skills';
import Experience from './components/Experience';
import Projects from './components/Projects';
import Contact from './components/Contact';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import SectionIndicator from './components/SectionIndicator';
import AdminPanel from './components/AdminPanel';
import ThemeToggle from './components/ThemeToggle';
import GrainOverlay from './components/polish/GrainOverlay';
import Toast from './components/polish/Toast';
import useScrollSpy from './hooks/useScrollSpy';

const Portfolio = ({ openAdmin = false }) => {
  const { content, loading } = useContent();
  const navigate = useNavigate();

  // Sections with no items don't render, so keep nav, dots, and scroll-spy
  // in sync with what's actually on the page.
  const hasSkills = (content.skills?.length ?? 0) > 0;
  const hasExperience = (content.experience?.length ?? 0) > 0;
  const hasProjects = (content.projects?.length ?? 0) > 0;
  const sections = useMemo(
    () => [
      'home',
      'about',
      ...(hasSkills ? ['skills'] : []),
      ...(hasProjects ? ['projects'] : []),
      ...(hasExperience ? ['experience'] : []),
      'contact',
    ],
    [hasSkills, hasExperience, hasProjects]
  );

  const activeSection = useScrollSpy(sections, 200);
  const [scrollProgress, setScrollProgress] = useState(0);
  // Opened via the secret /admin URL or the keyboard shortcut (no visible button).
  const [adminOpen, setAdminOpen] = useState(openAdmin);
  const [slowHint, setSlowHint] = useState(false);
  const trackedSections = useRef(new Set());

  const closeAdmin = () => {
    setAdminOpen(false);
    // If we arrived via /admin, drop back to the homepage URL.
    if (window.location.pathname === '/admin') navigate('/', { replace: true });
  };

  // On a cold server start the first load can take a while; after a few seconds
  // of waiting, reassure the visitor that it's loading, not broken.
  useEffect(() => {
    if (!loading) {
      setSlowHint(false);
      return undefined;
    }
    const t = setTimeout(() => setSlowHint(true), 5000);
    return () => clearTimeout(t);
  }, [loading]);

  // Visitor analytics: one pageview per load, one event per section per visit.
  // The secret /admin entrance is never tracked.
  useEffect(() => {
    if (openAdmin) return;
    api.trackEvent({
      type: 'pageview',
      path: window.location.pathname,
      referrer: document.referrer || null,
    });
  }, [openAdmin]);

  useEffect(() => {
    if (openAdmin) return;
    if (!activeSection || trackedSections.current.has(activeSection)) return;
    trackedSections.current.add(activeSection);
    api.trackEvent({ type: 'section', section: activeSection });
  }, [activeSection, openAdmin]);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Admin keyboard shortcut: Ctrl/Cmd + Shift + E
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setAdminOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll('.animate-on-scroll, .stagger-card').forEach((el) => {
      observer.observe(el);
    });

    const titleObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('is-inview');
        });
      },
      { threshold: 0.4 }
    );
    document.querySelectorAll('.section__title').forEach((el) => titleObs.observe(el));

    return () => {
      observer.disconnect();
      titleObs.disconnect();
    };
    // Re-attach once the gated section tree mounts (first load with no cache).
  }, [loading]);

  return (
    <div className="portfolio">
      {/* Covers the page until the real, current content arrives from the API,
          so a visitor never sees a stale or demo version before the live site. */}
      <div className={`page-loader ${loading ? '' : 'loaded'}`}>
        <span className="page-loader__text">A</span>
        <span className="page-loader__spinner" aria-hidden="true" />
        {slowHint && (
          <span className="page-loader__hint">Waking the server, this can take a moment.</span>
        )}
      </div>

      <div className="scroll-progress" style={{ width: `${scrollProgress}%` }} />
      <div className="aurora" aria-hidden="true">
        <span className="aurora__blob aurora__blob--amber" />
        <span className="aurora__blob aurora__blob--violet" />
        <span className="aurora__blob aurora__blob--cyan" />
      </div>
      <div className="vignette" aria-hidden="true" />
      <GrainOverlay />
      <Toast />

      {!loading && (
        <>
          {/* Mounts with the sections so its hero-visibility observer can
              find #home; otherwise the contour never fades past the hero. */}
          <ContourBackground />
          <Nav sections={sections} activeSection={activeSection} onNavigate={scrollToSection} />
          <SectionIndicator sections={sections} activeSection={activeSection} onNavigate={scrollToSection} />
          <Hero onNavigate={scrollToSection} />
          <About />
          <Skills />
          <Projects />
          <Experience />
          <Contact />
          <Footer />
          <ScrollToTop />
          <ThemeToggle />

          <AdminPanel open={adminOpen} onClose={closeAdmin} />
        </>
      )}
    </div>
  );
};

export default Portfolio;
