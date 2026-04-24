import React from 'react';

const labels = { home: '01', about: '02', skills: '03', experience: '04', projects: '05', contact: '06' };

const SectionIndicator = ({ sections, activeSection, onNavigate }) => {
  return (
    <div className="section-indicator">
      {sections.map((id) => (
        <button
          key={id}
          className={`section-indicator__dot ${activeSection === id ? 'section-indicator__dot--active' : ''}`}
          onClick={() => onNavigate(id)}
          aria-label={`Go to ${id}`}
        >
          <span className="section-indicator__number">{labels[id]}</span>
        </button>
      ))}
    </div>
  );
};

export default SectionIndicator;
