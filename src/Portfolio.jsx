import React, { useEffect, useState } from 'react';
import './Portfolio.css';
import ContourBackground from './components/ContourBackground';
import CustomCursor from './components/CustomCursor';
import Nav from './components/Nav';
import Hero from './components/Hero';
import About from './components/About';
import Skills from './components/Skills';
import Projects from './components/Projects';
import Contact from './components/Contact';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import SectionIndicator from './components/SectionIndicator';
import AdminPanel from './components/AdminPanel';
import GrainOverlay from './components/polish/GrainOverlay';
import Toast from './components/polish/Toast';
import useScrollSpy from './hooks/useScrollSpy';

const sections = ['home', 'about', 'skills', 'projects', 'contact'];

const Portfolio = () => {
  const activeSection = useScrollSpy(sections, 200);
  const [loaded, setLoaded] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [adminOpen, setAdminOpen] = useState(false);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);

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
  }, []);

  return (
    <div className="portfolio">
      <div className={`page-loader ${loaded ? 'loaded' : ''}`}>
        <span className="page-loader__text">A</span>
      </div>

      <CustomCursor />
      <div className="scroll-progress" style={{ width: `${scrollProgress}%` }} />
      <ContourBackground />
      <GrainOverlay />
      <Toast />
      <Nav sections={sections} activeSection={activeSection} onNavigate={scrollToSection} />
      <SectionIndicator sections={sections} activeSection={activeSection} onNavigate={scrollToSection} />
      <Hero onNavigate={scrollToSection} />
      <About />
      <Skills />
      <Projects />
      <Contact />
      <Footer />
      <ScrollToTop />

      <button
        className="admin-fab"
        onClick={() => setAdminOpen(true)}
        aria-label="Open editor (Ctrl+Shift+E)"
        title="Edit portfolio (Ctrl/Cmd+Shift+E)"
      >
        ✎
      </button>

      <AdminPanel open={adminOpen} onClose={() => setAdminOpen(false)} />
    </div>
  );
};

export default Portfolio;
