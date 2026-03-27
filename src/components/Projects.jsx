import React from 'react';

const projects = [
  {
    id: 1,
    emoji: '🐕',
    title: 'Dog Wash Booking System',
    description:
      'An online appointment booking system for Dog Wash services at PetValu. Features real-time availability, booking management, and customer notifications.',
    technologies: ['React', 'Node.js', 'PostgreSQL'],
    link: '#',
  },
  {
    id: 2,
    emoji: '🛒',
    title: 'E-Commerce Platform',
    description:
      'A full-stack e-commerce application with product catalog, shopping cart, secure checkout, and order tracking dashboard.',
    technologies: ['React', 'Express', 'MongoDB', 'Redis'],
    link: '#',
  },
  {
    id: 3,
    emoji: '🤖',
    title: 'AI Chat Assistant',
    description:
      'An intelligent conversational assistant powered by machine learning, featuring natural language understanding and context-aware responses.',
    technologies: ['Python', 'TensorFlow', 'React', 'FastAPI'],
    link: '#',
  },
];

const Projects = () => {
  return (
    <section id="projects" className="projects-section">
      <div className="projects__inner animate-on-scroll">
        <h2 className="section__title">My Projects</h2>
        <div className="projects__grid">
          {projects.map((project) => (
            <div key={project.id} className="project-card">
              <div className="project-card__image">{project.emoji}</div>
              <div className="project-card__body">
                <h3 className="project-card__title">{project.title}</h3>
                <p className="project-card__desc">{project.description}</p>
                <div className="project-card__tags">
                  {project.technologies.map((tech, i) => (
                    <span key={i} className="project-card__tag">
                      {tech}
                    </span>
                  ))}
                </div>
                <a href={project.link} className="project-card__link">
                  View Project →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;
