import React from 'react';
import { motion } from 'framer-motion';
import useReducedMotionSafe from '../../hooks/useReducedMotionSafe';

const AvailabilityPill = ({ active, label }) => {
  const reduced = useReducedMotionSafe();
  if (!label) return null;

  return (
    <motion.span
      className={`availability-pill${active ? '' : ' availability-pill--off'}`}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: [0.2, 0.7, 0.2, 1] }}
    >
      <span className="availability-pill__dot" aria-hidden="true" />
      {label}
    </motion.span>
  );
};

export default AvailabilityPill;
