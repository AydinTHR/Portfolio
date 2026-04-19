import React from 'react';
import { motion } from 'framer-motion';
import { stagger, charReveal, fadeUpChild, reduced } from '../../motion/variants';
import useReducedMotionSafe from '../../hooks/useReducedMotionSafe';

const SplitText = ({
  text,
  as = 'span',
  mode = 'char',
  gap = 0.035,
  delay = 0,
  className = '',
  animateOnMount = false,
  viewportAmount = 0.4,
}) => {
  const isReduced = useReducedMotionSafe();
  const Comp = motion[as] || motion.span;
  const units = mode === 'word' ? String(text).split(' ') : Array.from(String(text));
  const container = stagger(gap, delay);
  const child = isReduced ? reduced : mode === 'word' ? fadeUpChild : charReveal;
  const animationProps = animateOnMount
    ? { initial: 'hidden', animate: 'show' }
    : { initial: 'hidden', whileInView: 'show', viewport: { once: true, amount: viewportAmount } };

  return (
    <Comp className={className} variants={container} {...animationProps} aria-label={text}>
      {units.map((u, i) => (
        <motion.span
          key={i}
          variants={child}
          aria-hidden="true"
          style={{ display: 'inline-block', whiteSpace: 'pre' }}
        >
          {mode === 'word' ? (i < units.length - 1 ? u + ' ' : u) : u === ' ' ? '\u00A0' : u}
        </motion.span>
      ))}
    </Comp>
  );
};

export default SplitText;
