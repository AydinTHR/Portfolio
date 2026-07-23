import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useContent } from '../hooks/useContent';
import { resolveAssetUrl } from '../lib/api';
import { projectSlugs } from '../lib/slug';
import useReducedMotionSafe from '../hooks/useReducedMotionSafe';
import CountUp from './polish/CountUp';
import ExpeditionMap from './ExpeditionMap';

const TILT_AMOUNT = 6;
const SPRING = { stiffness: 160, damping: 18, mass: 0.6 };

// The map needs room to spread its basecamps out; below this the card layout is
// the better experience, not a legacy fallback.
const MAP_QUERY = '(min-width: 900px)';

const useMapViewport = () => {
  const [wide, setWide] = useState(() => window.matchMedia(MAP_QUERY).matches);

  useEffect(() => {
    const mq = window.matchMedia(MAP_QUERY);
    const handler = (e) => setWide(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return wide;
};

// Portfolio's page-wide reveal observer snapshots the DOM once per load, so
// cards that mount later (swapping down from the map when the window narrows
// past 900px) would otherwise stay stuck at the .stagger-card opacity of 0.
const useCardReveal = (active) => {
  const listRef = useRef(null);

  useEffect(() => {
    const list = listRef.current;
    if (!active || !list) return undefined;
    const hidden = list.querySelectorAll('.stagger-card:not(.visible)');
    if (!hidden.length) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.15 }
    );
    hidden.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [active]);

  return listRef;
};

const ProjectCard = ({ project, index, slug }) => {
  const reduced = useReducedMotionSafe();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rxSpring = useSpring(rx, SPRING);
  const rySpring = useSpring(ry, SPRING);
  const rotateX = useTransform(rxSpring, (v) => `${v}deg`);
  const rotateY = useTransform(rySpring, (v) => `${v}deg`);

  const yearNum = Number(String(project.year).replace(/\D/g, '')) || 0;

  const handleMove = (e) => {
    if (reduced) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    rx.set((0.5 - y) * TILT_AMOUNT);
    ry.set((x - 0.5) * TILT_AMOUNT);
  };

  const handleLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <article
      className="project-block stagger-card"
      style={{ '--i': index }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <motion.div
        className="project-block__tilt"
        style={{ rotateX, rotateY }}
      >
        {project.image && (
          <div className="project-block__media" aria-hidden="true">
            <img
              src={resolveAssetUrl(project.image)}
              alt=""
              className="project-block__media-img"
              loading="lazy"
              decoding="async"
            />
            <div className="project-block__media-fade" />
          </div>
        )}

        <div className="project-block__header">
          <div className="project-block__index">
            <span className="project-block__number">{project.number}</span>
            <span className="project-block__icon" aria-hidden="true">{project.icon}</span>
          </div>
          <span className="project-block__year">
            {yearNum ? <CountUp to={yearNum} duration={1600} format="plain" /> : project.year}
          </span>
        </div>

        {project.category && (
          <p className="project-block__category">{project.category}</p>
        )}

        <h3 className="project-block__title">
          {project.title}
          <span className="project-block__title-underline" aria-hidden="true" />
        </h3>

        <div className="project-block__techs">
          {project.technologies.map((tech, i) => (
            <span key={i} className="project-block__tech">
              <span className="project-block__tech-dot" aria-hidden="true" />
              {tech}
            </span>
          ))}
        </div>

        <p className="project-block__desc">{project.description}</p>

        <div className="project-block__actions">
          <Link to={`/projects/${slug}`} className="project-block__btn">
            <span>View Details</span>
            <span className="project-block__btn-arrow" aria-hidden="true">↗</span>
          </Link>
          {project.codeLink && project.codeLink !== '#' && (
            <a
              href={project.codeLink}
              className="project-block__btn project-block__btn--ghost"
              target="_blank"
              rel="noreferrer"
            >
              <span className="project-block__btn-icon" aria-hidden="true">&lt;/&gt;</span>
              <span>View Code</span>
            </a>
          )}
        </div>
      </motion.div>
    </article>
  );
};

const Projects = () => {
  const { content } = useContent();
  const showMap = useMapViewport();
  const listRef = useCardReveal(!showMap);

  // Hide the section entirely until it has content to show.
  if (!content.projects?.length) return null;

  const slugs = projectSlugs(content.projects);

  return (
    <section id="projects" className="projects-section">
      <div className="projects__inner">
        <h2 className="section__title animate-on-scroll">My Projects</h2>

        {showMap ? (
          <ExpeditionMap projects={content.projects} slugs={slugs} />
        ) : (
          <div className="projects__list" ref={listRef}>
            {content.projects.map((project, index) => (
              <ProjectCard key={index} project={project} index={index} slug={slugs[index]} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Projects;
