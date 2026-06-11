import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import '../Portfolio.css';
import { useContent } from '../hooks/useContent';
import { resolveAssetUrl } from '../lib/api';
import { projectSlugs } from '../lib/slug';

const isRealLink = (url) => url && url !== '#';

const ProjectDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { content } = useContent();

  const projects = content.projects || [];
  const slugs = projectSlugs(projects);
  const index = slugs.indexOf(slug);
  const project = index >= 0 ? projects[index] : null;

  useEffect(() => {
    if (!project) {
      navigate('/', { replace: true });
      return;
    }
    window.scrollTo(0, 0);
    const prev = document.title;
    document.title = `${project.title} | Aydin`;
    return () => {
      document.title = prev;
    };
  }, [project, navigate]);

  if (!project) return null;

  return (
    <div className="project-detail">
      <header className="project-detail__bar">
        <Link to="/" className="project-detail__back">
          ← Back to portfolio
        </Link>
      </header>

      <main className="project-detail__content">
        <p className="project-detail__eyebrow">
          {project.category}
          {project.year && <span className="project-detail__year">{project.year}</span>}
        </p>
        <h1 className="project-detail__title">{project.title}</h1>

        {Array.isArray(project.technologies) && project.technologies.length > 0 && (
          <ul className="project-detail__tech" aria-label="Technologies used">
            {project.technologies.map((t, i) => (
              <li key={i} className="project-detail__chip">
                {t}
              </li>
            ))}
          </ul>
        )}

        {(isRealLink(project.liveLink) || isRealLink(project.codeLink)) && (
          <div className="project-detail__links">
            {isRealLink(project.liveLink) && (
              <a className="btn-glass" href={project.liveLink} target="_blank" rel="noreferrer">
                View Live ↗
              </a>
            )}
            {isRealLink(project.codeLink) && (
              <a
                className="btn-glass btn-glass--outline"
                href={project.codeLink}
                target="_blank"
                rel="noreferrer"
              >
                View Code ↗
              </a>
            )}
          </div>
        )}

        {project.image && (
          <div className="project-detail__media">
            <img src={resolveAssetUrl(project.image)} alt={project.title} />
          </div>
        )}

        {project.description && (
          <p className="project-detail__desc">{project.description}</p>
        )}

        {Array.isArray(project.highlights) && project.highlights.length > 0 && (
          <>
            <h2 className="project-detail__subheading">Highlights</h2>
            <ul className="project-detail__highlights">
              {project.highlights.map((h, i) => (
                <li key={i}>
                  <span className="project-detail__arrow" aria-hidden="true">
                    →
                  </span>
                  {h}
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  );
};

export default ProjectDetail;
