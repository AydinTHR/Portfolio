// URL slug for a project title: "My Project Name" -> "my-project-name".
export const slugify = (title) =>
  (title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Slugs for a project list; duplicate titles get a positional suffix so every
// project stays addressable.
export const projectSlugs = (projects) => {
  const seen = new Map();
  return (projects || []).map((p) => {
    const base = slugify(p.title) || 'project';
    const count = seen.get(base) || 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count + 1}`;
  });
};
