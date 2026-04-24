import React from 'react';
import { motion } from 'framer-motion';
import { useContent } from '../hooks/useContent';

const Experience = () => {
  const { content } = useContent();
  const items = content.experience || [];

  return (
    <section id="experience" className="section">
      <div className="section__content">
        <p className="section__label">03 — Experience</p>
        <h2 className="section__title">Work Experience</h2>

        <ol className="timeline" aria-label="Work history">
          <div className="timeline__rail" aria-hidden="true" />
          {items.map((item, i) => (
            <motion.li
              key={i}
              className="timeline__item"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: 'easeOut' }}
            >
              <span className="timeline__dot" aria-hidden="true" />

              <article className="timeline__card">
                <header className="timeline__header">
                  <div className="timeline__role-wrap">
                    <span className="timeline__icon" aria-hidden="true">{item.icon}</span>
                    <div className="timeline__role-info">
                      <h3 className="timeline__role">{item.role}</h3>
                      <p className="timeline__company">
                        <span className="timeline__company-name">{item.company}</span>
                        {item.location && (
                          <>
                            <span className="timeline__dot-sep" aria-hidden="true">·</span>
                            <span className="timeline__location">{item.location}</span>
                          </>
                        )}
                        {item.type && (
                          <>
                            <span className="timeline__dot-sep" aria-hidden="true">·</span>
                            <span className="timeline__type">{item.type}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="timeline__dates">
                    {item.startDate} — {item.endDate || 'Present'}
                  </span>
                </header>

                {item.description && (
                  <p className="timeline__desc">{item.description}</p>
                )}

                {Array.isArray(item.highlights) && item.highlights.length > 0 && (
                  <ul className="timeline__highlights">
                    {item.highlights.map((h, j) => (
                      <li key={j} className="timeline__highlight">
                        <span className="timeline__arrow" aria-hidden="true">→</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
};

export default Experience;
