import React, { useEffect, useRef, useState } from 'react';
import useReducedMotionSafe from '../../hooks/useReducedMotionSafe';

const SIZE = 44;
const STROKE = 3;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

const ProficiencyRing = ({ value = 75 }) => {
  const reduced = useReducedMotionSafe();
  const [animatedValue, setAnimatedValue] = useState(reduced ? value : 0);
  const ref = useRef(null);

  useEffect(() => {
    if (reduced) {
      setAnimatedValue(value);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setAnimatedValue(value);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [value, reduced]);

  const offset = CIRC - (Math.max(0, Math.min(100, animatedValue)) / 100) * CIRC;

  return (
    <svg
      ref={ref}
      className="prof-ring"
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      aria-label={`Proficiency ${value}%`}
    >
      <circle className="prof-ring__track" cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} />
      <circle
        className="prof-ring__fill"
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={RADIUS}
        strokeDasharray={CIRC}
        strokeDashoffset={offset}
      />
      <text className="prof-ring__label" x={SIZE / 2} y={SIZE / 2}>
        {Math.round(animatedValue)}
      </text>
    </svg>
  );
};

export default ProficiencyRing;
