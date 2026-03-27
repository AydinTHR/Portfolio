import React from 'react';

const skills = [
  {
    title: 'Frontend',
    description: 'Modern web development',
    technologies: ['React', 'Vite', 'HTML5', 'CSS3', 'JavaScript ES6+'],
  },
  {
    title: 'Backend & APIs',
    description: 'Server-side development',
    technologies: ['Node.js', 'Express', 'REST APIs', 'GraphQL', 'Microservices'],
  },
  {
    title: 'Database & Storage',
    description: 'Data management solutions',
    technologies: ['PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'Firebase'],
  },
  {
    title: 'Machine Learning & AI',
    description: 'AI-powered solutions',
    technologies: ['TensorFlow', 'PyTorch', 'scikit-learn', 'NLP', 'Computer Vision'],
  },
  {
    title: 'Docker',
    description: 'Containerization & deployment',
    technologies: ['Docker', 'Docker Compose', 'Container Orchestration', 'CI/CD'],
  },
  {
    title: 'Design',
    description: 'UI/UX and visual design',
    technologies: ['Figma', 'Adobe XD', 'Responsive Design', 'Accessibility', 'UX Patterns'],
  },
];

const Skills = () => {
  return (
    <section id="skills" className="section">
      <div className="section__content animate-on-scroll">
        <h2 className="section__title">My Skills</h2>
        <div className="skills__grid">
          {skills.map((skill, index) => (
            <div key={index} className="skill-card">
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
