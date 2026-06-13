import { useState, useEffect, useCallback } from 'react';
import { defaults } from '../data/defaults';
import { api } from '../lib/api';

const UPDATE_EVENT = 'portfolio-content-updated';

const mergeSkill = (stored) => ({
  ...defaults.skills[0],
  proficiency: 75,
  ...stored,
});

const mergeProject = (stored) => ({
  ...defaults.projects[0],
  highlights: [],
  category: '',
  image: '',
  ...stored,
});

const mergeExperience = (stored) => ({
  role: '',
  company: '',
  location: '',
  type: '',
  startDate: '',
  endDate: '',
  icon: '◆',
  description: '',
  highlights: [],
  ...stored,
});

const mergeStats = (stored) =>
  Array.isArray(stored) && stored.length
    ? stored.map((s) => ({ label: '', value: 0, ...s }))
    : defaults.about.stats;

// Guard the API payload against missing fields so the UI always has a full shape.
const mergeContent = (parsed) => {
  if (!parsed) return defaults;
  return {
    hero: {
      ...defaults.hero,
      ...(parsed.hero || {}),
      availability: {
        ...defaults.hero.availability,
        ...(parsed.hero?.availability || {}),
      },
    },
    about: {
      ...defaults.about,
      ...(parsed.about || {}),
      stats: mergeStats(parsed.about?.stats),
    },
    contact: {
      ...defaults.contact,
      ...(parsed.contact || {}),
      links: Array.isArray(parsed.contact?.links) ? parsed.contact.links : defaults.contact.links,
    },
    skills: Array.isArray(parsed.skills) ? parsed.skills.map(mergeSkill) : defaults.skills,
    projects: Array.isArray(parsed.projects) ? parsed.projects.map(mergeProject) : defaults.projects,
    experience: Array.isArray(parsed.experience)
      ? parsed.experience.map(mergeExperience)
      : defaults.experience,
  };
};

// Last-known-good cache of the raw API payload (pre-merge), so a returning
// visitor gets an instant, correct first paint instead of the bundled demo
// content. Raw is stored (not the merged shape) so a future defaults.js change
// re-merges cleanly on the next load.
const CACHE_KEY = 'pf-content-cache';

const readCache = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(CACHE_KEY));
    return raw && raw.hero ? raw : null;
  } catch {
    return null;
  }
};

const persistCache = (raw) => {
  try {
    if (raw && raw.hero) localStorage.setItem(CACHE_KEY, JSON.stringify(raw));
  } catch {
    /* storage unavailable (private mode) — caching is best-effort */
  }
};

// Module-level cache: the content is fetched once per page load and shared by
// every component that calls useContent(). Seeds from localStorage so a repeat
// visitor never sees stale bundled defaults.
const seeded = readCache();
let cachedContent = seeded ? mergeContent(seeded) : null;
let firstFetchSettled = false;
let fetchPromise = null;

const loadFromApi = () => {
  if (!fetchPromise) {
    // Bound the request so a hung cold-start connection eventually resolves to
    // the cache/offline path rather than spinning forever.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    fetchPromise = api
      .getContent(controller.signal)
      .then((data) => {
        persistCache(data);
        cachedContent = mergeContent(data);
        return cachedContent;
      })
      .catch(() => {
        // Network failure: keep showing the cache if we have one, else fall
        // back to the bundled defaults so the site still renders.
        cachedContent = cachedContent || defaults;
        return cachedContent;
      })
      .finally(() => {
        firstFetchSettled = true;
        clearTimeout(timeout);
      });
  }
  return fetchPromise;
};

// Replace the cached content (e.g. after a version restore) and notify all
// mounted components.
export const refreshContent = (next) => {
  persistCache(next);
  cachedContent = mergeContent(next);
  window.dispatchEvent(new Event(UPDATE_EVENT));
};

export const useContent = () => {
  const [content, setContent] = useState(() => cachedContent);
  // Only the first-ever visit (no cache yet) waits; returning visitors render
  // their cached content immediately and revalidate in the background.
  const [loading, setLoading] = useState(() => cachedContent === null && !firstFetchSettled);

  useEffect(() => {
    let mounted = true;
    loadFromApi().then((c) => {
      if (mounted) {
        setContent(c);
        setLoading(false);
      }
    });
    const handler = () => setContent(cachedContent);
    window.addEventListener(UPDATE_EVENT, handler);
    return () => {
      mounted = false;
      window.removeEventListener(UPDATE_EVENT, handler);
    };
  }, []);

  // Publish new content to the server (requires an authenticated session).
  const update = useCallback(async (next) => {
    const saved = await api.putContent(next);
    persistCache(saved);
    cachedContent = mergeContent(saved);
    window.dispatchEvent(new Event(UPDATE_EVENT));
    return cachedContent;
  }, []);

  // `content` is null only on the very first paint with no cache; consumers
  // render behind the loading gate until then, but fall back to defaults so a
  // stray render never crashes on a null shape.
  return { content: content || defaults, loading, update };
};
