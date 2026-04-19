import React, { useEffect, useRef, useState } from 'react';
import useReducedMotionSafe from '../../hooks/useReducedMotionSafe';

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

const CountUp = ({ to, duration = 1400, className, suffix = '', format = 'locale' }) => {
  const reduced = useReducedMotionSafe();
  const [value, setValue] = useState(reduced ? to : 0);
  const ref = useRef(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (reduced) {
      setValue(to);
      return;
    }
    const el = ref.current;
    if (!el) return;

    const run = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        setValue(Math.round(easeOut(p) * to));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) run();
        });
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [to, duration, reduced]);

  const display = format === 'plain' ? String(value) : value.toLocaleString();

  return (
    <span ref={ref} className={className}>
      <span>{display}{suffix}</span>
    </span>
  );
};

export default CountUp;
