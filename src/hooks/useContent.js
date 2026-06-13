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

// Last-known-good cache of the raw API payload (pre-merge). It is used ONLY as
// an offline fallback when the live fetch fails — never to paint optimistically
// on load — so a visitor can never see a stale remembered copy before the real,
// current content arrives. Raw is stored (not the merged shape) so a future
// defaults.js change re-merges cleanly.
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
// every component that calls useContent(). We deliberately do NOT seed from
// localStorage — the page waits for the live API before rendering any content,
// so a visitor never sees a stale or placeholder version first.
let cachedContent = null;
let firstFetchSettled = false;
let fetchPromise = null;

const loadFromApi = () => {
  if (!fetchPromise) {
    // Bound the request so a hung cold-start connection eventually resolves to
    // the offline path rather than spinning forever.
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
        // Fetch failed/aborted (server unreachable): fall back to the visitor's
        // last-known-good content if we have it, otherwise the bundled defaults.
        const offline = readCache();
        cachedContent = offline ? mergeContent(offline) : defaults;
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
  // Always wait for the live fetch before showing content, so a visitor never
  // sees a stale or placeholder version first. Once the fetch has settled for
  // this page load, later consumers (e.g. the admin panel) skip the wait.
  const [loading, setLoading] = useState(() => !firstFetchSettled);

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
