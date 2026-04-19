import React, { useState, useEffect } from 'react';
import useMagnetic from '../hooks/useMagnetic';

const ScrollToTop = () => {
  const [visible, setVisible] = useState(false);
  const magnetic = useMagnetic(0.3);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.5);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollUp = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      className={`scroll-top btn-magnetic ${visible ? 'visible' : ''}`}
      onClick={scrollUp}
      onMouseMove={magnetic.onMove}
      onMouseLeave={magnetic.onLeave}
      onPointerDown={magnetic.onDown}
      aria-label="Scroll to top"
    >
      ↑
    </button>
  );
};

export default ScrollToTop;
