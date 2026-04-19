import { useCallback } from 'react';
import useReducedMotionSafe from './useReducedMotionSafe';

const useMagnetic = (strength = 0.35) => {
  const reduced = useReducedMotionSafe();

  const onMove = useCallback(
    (e) => {
      if (reduced) return;
      const btn = e.currentTarget;
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    },
    [strength, reduced]
  );

  const onLeave = useCallback((e) => {
    e.currentTarget.style.transform = 'translate(0, 0)';
  }, []);

  const onDown = useCallback(
    (e) => {
      if (reduced) return;
      const btn = e.currentTarget;
      const rect = btn.getBoundingClientRect();
      const rx = ((e.clientX - rect.left) / rect.width) * 100;
      const ry = ((e.clientY - rect.top) / rect.height) * 100;
      const ripple = document.createElement('span');
      ripple.className = 'btn-ripple';
      ripple.style.setProperty('--rx', `${rx}%`);
      ripple.style.setProperty('--ry', `${ry}%`);
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 750);
    },
    [reduced]
  );

  return { onMove, onLeave, onDown };
};

export default useMagnetic;
