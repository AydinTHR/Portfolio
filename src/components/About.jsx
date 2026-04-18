import React from 'react';
import profileImage from '../assets/profile.jpg';
import { useContent } from '../hooks/useContent';

const About = () => {
  const { content } = useContent();
  const src = content.about.profileImage || profileImage;

  return (
    <section id="about" className="section">
      <div className="section__content animate-on-scroll">
        <p className="section__label">01 — About</p>
        <h2 className="section__title">About Me</h2>
        <div className="about__layout">
          <div className="about__avatar">
            <div className="about__avatar-circle">
              <img src={src} alt={content.hero.name} className="about__avatar-img" />
            </div>
          </div>
          <div className="about__text">
            {content.about.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
