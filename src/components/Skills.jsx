import React from 'react';
import { useContent } from '../hooks/useContent';
import ProficiencyRing from './polish/ProficiencyRing';

const handleSpotlight = (e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
};

const Skills = () => {
  const { content } = useContent();

  return (
    <section id="skills" className="section">
      <div className="section__content">
        <p className="section__label">02 — Skills</p>
        <h2 className="section__title">My Skills</h2>
        <div className="skills__grid">
          {content.skills.map((skill, index) => (
            <div
              key={index}
              className="skill-card stagger-card"
              style={{ '--i': index }}
              onMouseMove={handleSpotlight}
            >
              <ProficiencyRing value={skill.proficiency ?? 75} />
              <h3 className="skill-card__title">{skill.title}</h3>
              <p className="skill-card__desc">{skill.description}</p>
              <div className="skill-card__techs">
                {skill.technologies.map((tech, i) => (
                  <div key={i} className="skill-card__tech">
                    {tech}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Skills;
