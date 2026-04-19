import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useContent } from '../hooks/useContent';
import useReducedMotionSafe from '../hooks/useReducedMotionSafe';
import useMagnetic from '../hooks/useMagnetic';
import AvailabilityPill from './polish/AvailabilityPill';
import { stagger, charReveal, reduced as reducedVariant } from '../motion/variants';

const SCRAMBLE_CHARS = '!<>-_\\/[]{}=+*^?#_____';

const Hero = ({ onNavigate }) => {
  const { content } = useContent();
  const reducedMotion = useReducedMotionSafe();
  const TITLES = content.hero.subtitles;
  const nameRef = useRef(null);
  const [subtitle, setSubtitle] = useState('');
  const subtitleRef = useRef({ titleIdx: 0, charIdx: 0, deleting: false, pauseTicks: 0 });
  const magnetic = useMagnetic(0.35);

  const { scrollY } = useScroll();
  const parallaxY = useTransform(scrollY, [0, 600], [0, 240]);
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);

  // Text scramble on mount
  useEffect(() => {
    const el = nameRef.current;
    if (!el) return;
    const target = content.hero.name;
    const length = target.length;
    let frame = 0;
    const totalFrames = length * 3;

    if (reducedMotion) {
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
  }, [content.hero.name, reducedMotion]);

  // Typewriter effect
  useEffect(() => {
    if (reducedMotion) {
      setSubtitle(TITLES[0] || '');
      return;
    }

    const interval = setInterval(() => {
      const s = subtitleRef.current;

      if (s.pauseTicks > 0) {
        s.pauseTicks--;
        return;
      }

      const currentTitle = TITLES[s.titleIdx];
      if (!currentTitle) return;

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
  }, [TITLES, reducedMotion]);

  const chars = Array.from(content.hero.greeting + ' ');
  const childVariant = reducedMotion ? reducedVariant : charReveal;

  return (
    <section id="home" className="hero">
      <motion.div
        className="hero__content"
        style={{ y: parallaxY, opacity: heroOpacity }}
      >
        <AvailabilityPill
          active={content.hero.availability?.active}
          label={content.hero.availability?.label}
        />
        <motion.h1
          className="hero__title"
          variants={stagger(0.04, 0.25)}
          initial="hidden"
          animate="show"
          aria-label={`${content.hero.greeting} ${content.hero.name}`}
        >
          {chars.map((c, i) => (
            <motion.span
              key={`g-${i}`}
              className="hero__name-char"
              variants={childVariant}
              aria-hidden="true"
              style={{ whiteSpace: 'pre' }}
            >
              {c}
            </motion.span>
          ))}
          <span className="hero__name" ref={nameRef}>
            {content.hero.name}
          </span>
        </motion.h1>
        <p className="hero__subtitle" aria-live="polite">
          {subtitle}
          <span className="hero__cursor">|</span>
        </p>
        <div className="hero__actions">
          <a
            className="btn-glass btn-magnetic"
            onClick={() => onNavigate('projects')}
            onMouseMove={magnetic.onMove}
            onMouseLeave={magnetic.onLeave}
            onPointerDown={magnetic.onDown}
          >
            View My Work
          </a>
          <a
            className="btn-glass btn-glass--outline btn-magnetic"
            href="#"
            onClick={(e) => e.preventDefault()}
            onMouseMove={magnetic.onMove}
            onMouseLeave={magnetic.onLeave}
            onPointerDown={magnetic.onDown}
          >
            Download Resume
          </a>
        </div>
      </motion.div>
      <div className="hero__scroll-hint" aria-hidden="true">
        <span>Scroll</span>
        <span className="hero__scroll-hint-line" />
      </div>
    </section>
  );
};

export default Hero;
