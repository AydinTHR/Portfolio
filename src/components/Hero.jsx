import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useContent } from '../hooks/useContent';

const SCRAMBLE_CHARS = '!<>-_\\/[]{}=+*^?#_____';

const Hero = ({ onNavigate }) => {
  const { content } = useContent();
  const TITLES = content.hero.subtitles;
  const heroRef = useRef(null);
  const nameRef = useRef(null);
  const [subtitle, setSubtitle] = useState('');
  const subtitleRef = useRef({ titleIdx: 0, charIdx: 0, deleting: false, pauseTicks: 0 });

  // Text scramble on mount
  useEffect(() => {
    const el = nameRef.current;
    if (!el) return;
    const target = content.hero.name;
    const length = target.length;
    let frame = 0;
    const totalFrames = length * 3;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = target;
      return;
    }

    let rafId;
    const tick = () => {
      let output = '';
      for (let i = 0; i < length; i++) {
        const resolveAt = i * 3;
        if (frame >= resolveAt + 3) {
          output += target[i];
        } else {
          output += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }
      }
      el.textContent = output;
      frame++;
      if (frame <= totalFrames + 3) {
        rafId = requestAnimationFrame(tick);
      } else {
        el.textContent = target;
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [content.hero.name]);

  // Typewriter effect
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setSubtitle(TITLES[0]);
      return;
    }

    const interval = setInterval(() => {
      const s = subtitleRef.current;

      if (s.pauseTicks > 0) {
        s.pauseTicks--;
        return;
      }

      const currentTitle = TITLES[s.titleIdx];

      if (!s.deleting) {
        s.charIdx++;
        setSubtitle(currentTitle.slice(0, s.charIdx));
        if (s.charIdx === currentTitle.length) {
          s.deleting = true;
          s.pauseTicks = 30;
        }
      } else {
        s.charIdx--;
        setSubtitle(currentTitle.slice(0, s.charIdx));
        if (s.charIdx === 0) {
          s.deleting = false;
          s.titleIdx = (s.titleIdx + 1) % TITLES.length;
          s.pauseTicks = 6;
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, [TITLES]);

  // Hero parallax on scroll
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const el = heroRef.current;
    if (!el) return;

    const onScroll = () => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      const progress = Math.min(scrollY / vh, 1);
      el.style.transform = `translateY(${scrollY * 0.4}px)`;
      el.style.opacity = 1 - progress;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Magnetic button handlers
  const handleMagneticMove = useCallback((e) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btn.style.transform = `translate(${x * 0.35}px, ${y * 0.35}px)`;
  }, []);

  const handleMagneticLeave = useCallback((e) => {
    e.currentTarget.style.transform = 'translate(0, 0)';
  }, []);

  return (
    <section id="home" className="hero">
      <div className="hero__content" ref={heroRef}>
        <h1 className="hero__title">
          {content.hero.greeting} <span className="hero__name" ref={nameRef}>{content.hero.name}</span>
        </h1>
        <p className="hero__subtitle">
          {subtitle}<span className="hero__cursor">|</span>
        </p>
        <div className="hero__actions">
          <a
            className="btn-glass btn-magnetic"
            onClick={() => onNavigate('projects')}
            onMouseMove={handleMagneticMove}
            onMouseLeave={handleMagneticLeave}
          >
            View My Work
          </a>
          <a
            className="btn-glass btn-glass--outline btn-magnetic"
            href="#"
            onClick={(e) => e.preventDefault()}
            onMouseMove={handleMagneticMove}
            onMouseLeave={handleMagneticLeave}
          >
            Download Resume
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
