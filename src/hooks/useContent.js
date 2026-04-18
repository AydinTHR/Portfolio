import { useState, useEffect, useCallback } from 'react';
import { defaults } from '../data/defaults';

const STORAGE_KEY = 'portfolio-content-v1';
const UPDATE_EVENT = 'portfolio-content-updated';

const loadContent = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaults;
    const parsed = JSON.parse(stored);
    return {
      hero: { ...defaults.hero, ...(parsed.hero || {}) },
      about: { ...defaults.about, ...(parsed.about || {}) },
      contact: {
        ...defaults.contact,
        ...(parsed.contact || {}),
        links: Array.isArray(parsed.contact?.links) ? parsed.contact.links : defaults.contact.links,
      },
      skills: Array.isArray(parsed.skills) ? parsed.skills : defaults.skills,
      projects: Array.isArray(parsed.projects) ? parsed.projects : defaults.projects,
    };
  } catch {
    return defaults;
  }
};

export const useContent = () => {
  const [content, setContent] = useState(loadContent);

  useEffect(() => {
    const handler = () => setContent(loadContent());
    window.addEventListener(UPDATE_EVENT, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(UPDATE_EVENT, handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const update = useCallback((next) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(UPDATE_EVENT));
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(UPDATE_EVENT));
  }, []);

  return { content, update, reset };
};
