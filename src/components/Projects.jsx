import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useContent } from '../hooks/useContent';
import { resolveAssetUrl } from '../lib/api';
import { projectSlugs } from '../lib/slug';
import useReducedMotionSafe from '../hooks/useReducedMotionSafe';
import CountUp from './polish/CountUp';

const TILT_AMOUNT = 6;
const SPRING = { stiffness: 160, damping: 18, mass: 0.6 };

const ProjectCard = ({ project, index, slug }) => {
  const reduced = useReducedMotionSafe();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
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
    gx.set(x * 100);
    gy.set(y * 100);
    e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
    e.currentTarget.style.setProperty('--glare-x', `${x * 100}%`);
    e.currentTarget.style.setProperty('--glare-y', `${y * 100}%`);
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
        <div className="project-block__glare" aria-hidden="true" />

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

  // Hide the section entirely until it has content to show.
  if (!content.projects?.length) return null;

  const slugs = projectSlugs(content.projects);

  return (
    <section id="projects" className="projects-section">
      <div className="projects__inner">
        <h2 className="section__title animate-on-scroll">My Projects</h2>

        <div className="projects__list">
          {content.projects.map((project, index) => (
            <ProjectCard key={index} project={project} index={index} slug={slugs[index]} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;
