import React from 'react';
import { showToast } from './Toast';

const CopyEmailButton = ({ email }) => {
  const handle = async () => {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      showToast('Email copied');
    } catch {
      showToast('Could not copy');
    }
  };

  if (!email) return null;

  return (
    <button type="button" className="contact__copy-email" onClick={handle} aria-label={`Copy ${email}`}>
      <span aria-hidden="true">⎘</span> Copy email
    </button>
  );
};

export default CopyEmailButton;
