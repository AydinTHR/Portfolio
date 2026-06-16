import React from 'react';
import { useContent } from '../hooks/useContent';
import ProficiencyBar from './polish/ProficiencyBar';

const handleSpotlight = (e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
};

const Skills = () => {
  const { content } = useContent();

  // Hide the section entirely until it has content to show.
  if (!content.skills?.length) return null;

  return (
    <section id="skills" className="section">
      <div className="section__content">
        <h2 className="section__title">My Skills</h2>
        <div className="skills__grid">
          {content.skills.map((skill, index) => (
            <div
              key={index}
              className="skill-card stagger-card"
              style={{ '--i': index }}
              onMouseMove={handleSpotlight}
            >
              <div className="skill-card__top">
                <h3 className="skill-card__title">{skill.title}</h3>
                {skill.description && <p className="skill-card__desc">{skill.description}</p>}
              </div>

              <ProficiencyBar value={skill.proficiency ?? 75} />

              {skill.technologies?.length > 0 && (
                <div className="skill-card__techs">
                  {skill.technologies.map((tech, i) => (
                    <span key={i} className="skill-card__tech">
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Skills;
