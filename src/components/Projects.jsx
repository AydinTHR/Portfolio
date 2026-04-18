import React from 'react';
import { useContent } from '../hooks/useContent';

const handleSpotlight = (e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
};

const Projects = () => {
  const { content } = useContent();

  return (
    <section id="projects" className="projects-section">
      <div className="projects__inner">
        <p className="section__label animate-on-scroll">03 — Projects</p>
        <h2 className="section__title animate-on-scroll">My Projects</h2>

        <div className="projects__list">
          {content.projects.map((project, index) => (
            <article
              key={index}
              className="project-block stagger-card"
              style={{ '--i': index }}
              onMouseMove={handleSpotlight}
            >
              <div className="project-block__header">
                <div className="project-block__index">
                  <span className="project-block__number">{project.number}</span>
                  <span className="project-block__icon" aria-hidden="true">{project.icon}</span>
                </div>
                <span className="project-block__year">{project.year}</span>
              </div>

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
                <a href={project.liveLink || '#'} className="project-block__btn">
                  <span>View Details</span>
                  <span className="project-block__btn-arrow" aria-hidden="true">↗</span>
                </a>
                <a href={project.codeLink || '#'} className="project-block__btn project-block__btn--ghost">
                  <span className="project-block__btn-icon" aria-hidden="true">&lt;/&gt;</span>
                  <span>View Code</span>
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;
