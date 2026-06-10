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

// Module-level cache: the content is fetched once per page load and shared by
// every component that calls useContent().
let cachedContent = null;
let fetchPromise = null;

const loadFromApi = () => {
  if (!fetchPromise) {
    fetchPromise = api
      .getContent()
      .then((data) => {
        cachedContent = mergeContent(data);
        return cachedContent;
      })
      .catch(() => {
        // API unreachable — render the bundled defaults so the site still works.
        cachedContent = defaults;
        return defaults;
      });
  }
  return fetchPromise;
};

// Replace the cached content (e.g. after a version restore) and notify all
// mounted components.
export const refreshContent = (next) => {
  cachedContent = mergeContent(next);
  window.dispatchEvent(new Event(UPDATE_EVENT));
};

export const useContent = () => {
  const [content, setContent] = useState(() => cachedContent || defaults);

  useEffect(() => {
    let mounted = true;
    loadFromApi().then((c) => {
      if (mounted) setContent(c);
    });
    const handler = () => setContent(cachedContent || defaults);
    window.addEventListener(UPDATE_EVENT, handler);
    return () => {
      mounted = false;
      window.removeEventListener(UPDATE_EVENT, handler);
    };
  }, []);

  // Publish new content to the server (requires an authenticated session).
  const update = useCallback(async (next) => {
    const saved = await api.putContent(next);
    cachedContent = mergeContent(saved);
    window.dispatchEvent(new Event(UPDATE_EVENT));
    return cachedContent;
  }, []);

  return { content, update };
};
