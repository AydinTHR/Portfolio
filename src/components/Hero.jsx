import React from 'react';

const Hero = ({ onNavigate }) => {
  return (
    <section id="home" className="hero">
      <div className="hero__content">
        <h1 className="hero__title">Hi, I'm Aydin</h1>
        <p className="hero__subtitle">
          Full Stack Developer | Designer | Creative Thinker
        </p>
        <div className="hero__actions">
          <a className="btn-glass" onClick={() => onNavigate('projects')}>
            View My Work
          </a>
          <a className="btn-glass btn-glass--outline" href="#" onClick={(e) => e.preventDefault()}>
            Download Resume
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
