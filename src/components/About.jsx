import React from 'react';
import { motion } from 'framer-motion';
import profileImage from '../assets/profile.jpg';
import { useContent } from '../hooks/useContent';
import { stagger, fadeUpChild } from '../motion/variants';
import CountUp from './polish/CountUp';

const About = () => {
  const { content } = useContent();
  const src = content.about.profileImage || profileImage;
  const stats = content.about.stats || [];

  return (
    <section id="about" className="section">
      <div className="section__content">
        <p className="section__label">01 — About</p>
        <h2 className="section__title">About Me</h2>
        <div className="about__layout">
          <div className="about__avatar">
            <div className="about__avatar-circle">
              <img
                src={src}
                alt={content.hero.name}
                className="about__avatar-img"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
          <div className="about__text">
            {content.about.paragraphs.map((p, pi) => {
              const words = p.split(' ');
              return (
                <motion.p
                  key={pi}
                  variants={stagger(0.022, pi * 0.1)}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.25 }}
                >
                  {words.map((w, wi) => (
                    <motion.span
                      key={wi}
                      variants={fadeUpChild}
                      style={{ display: 'inline-block', whiteSpace: 'pre' }}
                    >
                      {w}
                      {wi < words.length - 1 ? ' ' : ''}
                    </motion.span>
                  ))}
                </motion.p>
              );
            })}
            {stats.length > 0 && (
              <motion.div
                className="about__stats"
                variants={stagger(0.12, 0.2)}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.4 }}
              >
                {stats.map((s, i) => (
                  <motion.div key={i} className="about__stat" variants={fadeUpChild}>
                    <span className="about__stat-value">
                      <CountUp to={Number(s.value) || 0} />
                    </span>
                    <span className="about__stat-label">{s.label}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
