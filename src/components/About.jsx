import React from 'react';

const About = () => {
  return (
    <section id="about" className="section">
      <div className="section__content animate-on-scroll">
        <h2 className="section__title">About Me</h2>
        <div className="about__layout">
          <div className="about__avatar">
            <div className="about__avatar-circle">A</div>
          </div>
          <div className="about__text">
            <p>
              Hello! I'm a passionate full stack developer with a love for creating
              beautiful and functional web applications. I enjoy turning complex
              problems into simple, elegant solutions.
            </p>
            <p>
              When I'm not coding, you can find me exploring new technologies,
              reading tech blogs, or working on personal projects. I believe in
              continuous learning and staying up-to-date with the latest web
              development trends.
            </p>
            <p>
              I'm always excited to collaborate on interesting projects and connect
              with fellow developers!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
