import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

const useReducedMotionSafe = () => {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(QUERY).matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
};

export default useReducedMotionSafe;
