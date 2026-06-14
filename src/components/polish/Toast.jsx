import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

const EVENT = 'portfolio-toast';

export const showToast = (message, duration = 2400) => {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { message, duration } }));
};

const Toast = () => {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      setToast({ id: Date.now(), message: e.detail.message });
      const t = setTimeout(() => setToast(null), e.detail.duration);
      return () => clearTimeout(t);
    };
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);

  if (typeof document === 'undefined') return null;

  return createPortal(
    // Fixed full-width wrapper centers the toast via flexbox, so Framer Motion
    // can drive the element's transform (y/scale) without fighting a
    // translateX(-50%) centering hack (which it would overwrite, shifting the
    // toast off-center).
    <div className="toast-viewport">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            className="toast"
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <span className="toast__icon" aria-hidden="true">✓</span>
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body
  );
};

export default Toast;
