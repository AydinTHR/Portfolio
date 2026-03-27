import React, { useState } from 'react';

const Nav = ({ sections, activeSection, onNavigate }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleClick = (id) => {
    onNavigate(id);
    setMenuOpen(false);
  };

  return (
    <nav className="nav">
      <button
        className={`nav__hamburger ${menuOpen ? 'open' : ''}`}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        <span />
        <span />
        <span />
      </button>
      <ul className={`nav__list ${menuOpen ? 'open' : ''}`}>
        {sections.map((section) => (
          <li key={section}>
            <a
              className={`nav__link ${activeSection === section ? 'nav__link--active' : ''}`}
              onClick={() => handleClick(section)}
            >
              {section.charAt(0).toUpperCase() + section.slice(1)}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Nav;
