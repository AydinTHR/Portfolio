import React, { useEffect, useRef, useState } from 'react';
import useReducedMotionSafe from '../../hooks/useReducedMotionSafe';

// Horizontal proficiency bar that fills from 0 to `value`% the first time it
// scrolls into view (instant for reduced-motion users).
const ProficiencyBar = ({ value = 75 }) => {
  const reduced = useReducedMotionSafe();
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const [fill, setFill] = useState(reduced ? pct : 0);
  const ref = useRef(null);

  useEffect(() => {
    if (reduced) {
      setFill(pct);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setFill(pct);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [pct, reduced]);

  return (
    <div className="skill-bar" ref={ref} role="img" aria-label={`Proficiency ${pct}%`}>
      <div className="skill-bar__track">
        <div className="skill-bar__fill" style={{ width: `${fill}%` }} />
      </div>
      <span className="skill-bar__value">{pct}%</span>
    </div>
  );
};

export default ProficiencyBar;
