import React, { useState, useRef, useEffect } from 'react';
import { useContent } from '../hooks/useContent';
import { defaults } from '../data/defaults';

const TABS = ['Hero', 'About', 'Skills', 'Experience', 'Projects', 'Contact', 'Data'];
const SOCIAL_TYPES = ['email', 'github', 'linkedin', 'twitter', 'instagram'];

const AdminPanel = ({ open, onClose }) => {
  const { content, update, reset } = useContent();
  const [tab, setTab] = useState('Hero');
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const patch = (section, value) => {
    update({ ...content, [section]: value });
  };

  const updateField = (section, field, value) => {
    patch(section, { ...content[section], [field]: value });
  };

  const updateListItem = (section, index, newItem) => {
    const list = [...content[section]];
    list[index] = newItem;
    patch(section, list);
  };

  const removeListItem = (section, index) => {
    const list = content[section].filter((_, i) => i !== index);
    patch(section, list);
  };

  const addSkill = () => {
    patch('skills', [
      ...content.skills,
      { title: 'New Skill', description: 'Description', technologies: ['Tech 1'], proficiency: 75 },
    ]);
  };

  const addProject = () => {
    const num = String(content.projects.length + 1).padStart(2, '0');
    patch('projects', [
      ...content.projects,
      {
        number: num,
        year: new Date().getFullYear().toString(),
        icon: '◆',
        category: 'Web app',
        image: '',
        title: 'New Project',
        description: 'Description',
        technologies: ['Tech 1'],
        liveLink: '#',
        codeLink: '#',
        highlights: [],
      },
    ]);
  };

  const addStat = () => {
    updateField('about', 'stats', [...(content.about.stats || []), { label: 'New stat', value: 0 }]);
  };

  const removeStat = (i) => {
    updateField(
      'about',
      'stats',
      (content.about.stats || []).filter((_, idx) => idx !== i)
    );
  };

  const onImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      updateField('about', 'profileImage', ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'portfolio-content.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        update({
          hero: { ...defaults.hero, ...(parsed.hero || {}) },
          about: { ...defaults.about, ...(parsed.about || {}) },
          skills: Array.isArray(parsed.skills) ? parsed.skills : defaults.skills,
          projects: Array.isArray(parsed.projects) ? parsed.projects : defaults.projects,
        });
        setImportError('');
      } catch {
        setImportError('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-panel" onClick={(e) => e.stopPropagation()}>
        <header className="admin-header">
          <h2 className="admin-title">Portfolio Editor</h2>
          <button className="admin-close" onClick={onClose} aria-label="Close">×</button>
        </header>

        <nav className="admin-tabs">
          {TABS.map((t) => (
            <button
              key={t}
              className={`admin-tab ${tab === t ? 'admin-tab--active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </nav>

        <div className="admin-content">
          {tab === 'Hero' && (
            <div className="admin-section">
              <label className="admin-label">Greeting</label>
              <input
                className="admin-input"
                value={content.hero.greeting}
                onChange={(e) => updateField('hero', 'greeting', e.target.value)}
              />

              <label className="admin-label">Name</label>
              <input
                className="admin-input"
                value={content.hero.name}
                onChange={(e) => updateField('hero', 'name', e.target.value)}
              />

              <label className="admin-label">Rotating subtitles (one per line)</label>
              <textarea
                className="admin-textarea"
                rows={4}
                value={content.hero.subtitles.join('\n')}
                onChange={(e) =>
                  updateField('hero', 'subtitles', e.target.value.split('\n').filter(Boolean))
                }
              />

              <label className="admin-label" style={{ marginTop: '1rem' }}>Availability pill</label>
              <div className="admin-row">
                <div>
                  <label className="admin-sublabel">Show pill</label>
                  <select
                    className="admin-input"
                    value={content.hero.availability?.active ? 'on' : 'off'}
                    onChange={(e) =>
                      updateField('hero', 'availability', {
                        ...(content.hero.availability || {}),
                        active: e.target.value === 'on',
                      })
                    }
                  >
                    <option value="on">On</option>
                    <option value="off">Off</option>
                  </select>
                </div>
                <div>
                  <label className="admin-sublabel">Label</label>
                  <input
                    className="admin-input"
                    value={content.hero.availability?.label || ''}
                    onChange={(e) =>
                      updateField('hero', 'availability', {
                        ...(content.hero.availability || {}),
                        label: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {tab === 'About' && (
            <div className="admin-section">
              <label className="admin-label">Profile image</label>
              <div className="admin-image-row">
                <div className="admin-image-preview">
                  {content.about.profileImage ? (
                    <img src={content.about.profileImage} alt="profile" />
                  ) : (
                    <span>Using default</span>
                  )}
                </div>
                <div className="admin-image-actions">
                  <button
                    type="button"
                    className="admin-btn"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    Upload Image
                  </button>
                  {content.about.profileImage && (
                    <button
                      type="button"
                      className="admin-btn admin-btn--ghost"
                      onClick={() => updateField('about', 'profileImage', null)}
                    >
                      Reset to Default
                    </button>
                  )}
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={onImageUpload}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>

              <label className="admin-label">Paragraphs (one per line)</label>
              <textarea
                className="admin-textarea"
                rows={8}
                value={content.about.paragraphs.join('\n')}
                onChange={(e) =>
                  updateField(
                    'about',
                    'paragraphs',
                    e.target.value.split('\n').filter((p) => p.trim().length > 0)
                  )
                }
              />

              <label className="admin-label" style={{ marginTop: '1.25rem' }}>Stat chips</label>
              {(content.about.stats || []).map((stat, i) => (
                <div key={i} className="admin-row">
                  <div>
                    <label className="admin-sublabel">Label</label>
                    <input
                      className="admin-input"
                      value={stat.label}
                      onChange={(e) => {
                        const next = [...(content.about.stats || [])];
                        next[i] = { ...stat, label: e.target.value };
                        updateField('about', 'stats', next);
                      }}
                    />
                  </div>
                  <div>
                    <label className="admin-sublabel">Value (number)</label>
                    <input
                      className="admin-input"
                      type="number"
                      value={stat.value}
                      onChange={(e) => {
                        const next = [...(content.about.stats || [])];
                        next[i] = { ...stat, value: Number(e.target.value) || 0 };
                        updateField('about', 'stats', next);
                      }}
                    />
                  </div>
                  <button
                    className="admin-btn admin-btn--danger"
                    onClick={() => removeStat(i)}
                    style={{ alignSelf: 'flex-end' }}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button className="admin-btn admin-btn--add" onClick={addStat}>
                + Add Stat
              </button>
            </div>
          )}

          {tab === 'Skills' && (
            <div className="admin-section">
              {content.skills.map((skill, i) => (
                <div key={i} className="admin-card">
                  <div className="admin-card-head">
                    <span className="admin-card-num">#{i + 1}</span>
                    <button
                      className="admin-btn admin-btn--danger"
                      onClick={() => removeListItem('skills', i)}
                    >
                      Remove
                    </button>
                  </div>
                  <label className="admin-label">Title</label>
                  <input
                    className="admin-input"
                    value={skill.title}
                    onChange={(e) =>
                      updateListItem('skills', i, { ...skill, title: e.target.value })
                    }
                  />
                  <label className="admin-label">Description</label>
                  <input
                    className="admin-input"
                    value={skill.description}
                    onChange={(e) =>
                      updateListItem('skills', i, { ...skill, description: e.target.value })
                    }
                  />
                  <label className="admin-label">Technologies (comma separated)</label>
                  <input
                    className="admin-input"
                    value={skill.technologies.join(', ')}
                    onChange={(e) =>
                      updateListItem('skills', i, {
                        ...skill,
                        technologies: e.target.value
                          .split(',')
                          .map((t) => t.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                  <label className="admin-label">Proficiency: {skill.proficiency ?? 75}%</label>
                  <input
                    className="admin-input admin-range"
                    type="range"
                    min={0}
                    max={100}
                    value={skill.proficiency ?? 75}
                    onChange={(e) =>
                      updateListItem('skills', i, {
                        ...skill,
                        proficiency: Number(e.target.value),
                      })
                    }
                  />
                </div>
              ))}
              <button className="admin-btn admin-btn--add" onClick={addSkill}>
                + Add Skill
              </button>
            </div>
          )}

          {tab === 'Experience' && (
            <div className="admin-section">
              <p className="admin-note">
                Your work history — roles, dates, and what you shipped. Stacked chronologically in the timeline.
              </p>
              {(content.experience || []).map((exp, i) => (
                <div key={i} className="admin-card">
                  <div className="admin-card-head">
                    <span className="admin-card-num">#{i + 1}</span>
                    <button
                      className="admin-btn admin-btn--danger"
                      onClick={() => {
                        const next = (content.experience || []).filter((_, idx) => idx !== i);
                        patch('experience', next);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  <label className="admin-label">Role / Title</label>
                  <input
                    className="admin-input"
                    value={exp.role}
                    onChange={(e) => {
                      const next = [...content.experience];
                      next[i] = { ...exp, role: e.target.value };
                      patch('experience', next);
                    }}
                  />
                  <div className="admin-row">
                    <div>
                      <label className="admin-label">Company</label>
                      <input
                        className="admin-input"
                        value={exp.company}
                        onChange={(e) => {
                          const next = [...content.experience];
                          next[i] = { ...exp, company: e.target.value };
                          patch('experience', next);
                        }}
                      />
                    </div>
                    <div>
                      <label className="admin-label">Location</label>
                      <input
                        className="admin-input"
                        value={exp.location}
                        onChange={(e) => {
                          const next = [...content.experience];
                          next[i] = { ...exp, location: e.target.value };
                          patch('experience', next);
                        }}
                      />
                    </div>
                    <div>
                      <label className="admin-label">Type</label>
                      <input
                        className="admin-input"
                        value={exp.type}
                        placeholder="On-site / Remote / Hybrid"
                        onChange={(e) => {
                          const next = [...content.experience];
                          next[i] = { ...exp, type: e.target.value };
                          patch('experience', next);
                        }}
                      />
                    </div>
                  </div>
                  <div className="admin-row">
                    <div>
                      <label className="admin-label">Start date</label>
                      <input
                        className="admin-input"
                        value={exp.startDate}
                        placeholder="May 2025"
                        onChange={(e) => {
                          const next = [...content.experience];
                          next[i] = { ...exp, startDate: e.target.value };
                          patch('experience', next);
                        }}
                      />
                    </div>
                    <div>
                      <label className="admin-label">End date</label>
                      <input
                        className="admin-input"
                        value={exp.endDate}
                        placeholder="Present"
                        onChange={(e) => {
                          const next = [...content.experience];
                          next[i] = { ...exp, endDate: e.target.value };
                          patch('experience', next);
                        }}
                      />
                    </div>
                    <div>
                      <label className="admin-label">Icon</label>
                      <input
                        className="admin-input"
                        value={exp.icon}
                        onChange={(e) => {
                          const next = [...content.experience];
                          next[i] = { ...exp, icon: e.target.value };
                          patch('experience', next);
                        }}
                      />
                    </div>
                  </div>
                  <label className="admin-label">Description</label>
                  <textarea
                    className="admin-textarea"
                    rows={3}
                    value={exp.description}
                    onChange={(e) => {
                      const next = [...content.experience];
                      next[i] = { ...exp, description: e.target.value };
                      patch('experience', next);
                    }}
                  />
                  <label className="admin-label">Highlights / Bullets (one per line)</label>
                  <textarea
                    className="admin-textarea"
                    rows={4}
                    value={(exp.highlights || []).join('\n')}
                    onChange={(e) => {
                      const next = [...content.experience];
                      next[i] = {
                        ...exp,
                        highlights: e.target.value.split('\n').filter((h) => h.trim().length > 0),
                      };
                      patch('experience', next);
                    }}
                  />
                </div>
              ))}
              <button
                className="admin-btn admin-btn--add"
                onClick={() => {
                  const next = [
                    ...(content.experience || []),
                    {
                      role: 'New Role',
                      company: 'Company',
                      location: '',
                      type: '',
                      startDate: '',
                      endDate: 'Present',
                      icon: '◆',
                      description: '',
                      highlights: [],
                    },
                  ];
                  patch('experience', next);
                }}
              >
                + Add Experience
              </button>
            </div>
          )}

          {tab === 'Projects' && (
            <div className="admin-section">
              {content.projects.map((project, i) => (
                <div key={i} className="admin-card">
                  <div className="admin-card-head">
                    <span className="admin-card-num">#{i + 1}</span>
                    <button
                      className="admin-btn admin-btn--danger"
                      onClick={() => removeListItem('projects', i)}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="admin-row">
                    <div>
                      <label className="admin-label">Number</label>
                      <input
                        className="admin-input"
                        value={project.number}
                        onChange={(e) =>
                          updateListItem('projects', i, { ...project, number: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="admin-label">Year</label>
                      <input
                        className="admin-input"
                        value={project.year}
                        onChange={(e) =>
                          updateListItem('projects', i, { ...project, year: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="admin-label">Icon</label>
                      <input
                        className="admin-input"
                        value={project.icon}
                        onChange={(e) =>
                          updateListItem('projects', i, { ...project, icon: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <label className="admin-label">Category eyebrow</label>
                  <input
                    className="admin-input"
                    value={project.category || ''}
                    placeholder="e.g. Full-stack web app"
                    onChange={(e) =>
                      updateListItem('projects', i, { ...project, category: e.target.value })
                    }
                  />
                  <label className="admin-label">Image URL (optional)</label>
                  <input
                    className="admin-input"
                    value={project.image || ''}
                    placeholder="https://... (leave blank for no image)"
                    onChange={(e) =>
                      updateListItem('projects', i, { ...project, image: e.target.value })
                    }
                  />
                  <label className="admin-label">Title</label>
                  <input
                    className="admin-input"
                    value={project.title}
                    onChange={(e) =>
                      updateListItem('projects', i, { ...project, title: e.target.value })
                    }
                  />
                  <label className="admin-label">Description</label>
                  <textarea
                    className="admin-textarea"
                    rows={3}
                    value={project.description}
                    onChange={(e) =>
                      updateListItem('projects', i, { ...project, description: e.target.value })
                    }
                  />
                  <label className="admin-label">Technologies (comma separated)</label>
                  <input
                    className="admin-input"
                    value={project.technologies.join(', ')}
                    onChange={(e) =>
                      updateListItem('projects', i, {
                        ...project,
                        technologies: e.target.value
                          .split(',')
                          .map((t) => t.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                  <div className="admin-row">
                    <div>
                      <label className="admin-label">Live link</label>
                      <input
                        className="admin-input"
                        value={project.liveLink}
                        onChange={(e) =>
                          updateListItem('projects', i, { ...project, liveLink: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="admin-label">Code link</label>
                      <input
                        className="admin-input"
                        value={project.codeLink}
                        onChange={(e) =>
                          updateListItem('projects', i, { ...project, codeLink: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <label className="admin-label">Highlights (one per line, max 3 shown)</label>
                  <textarea
                    className="admin-textarea"
                    rows={3}
                    value={(project.highlights || []).join('\n')}
                    onChange={(e) =>
                      updateListItem('projects', i, {
                        ...project,
                        highlights: e.target.value.split('\n').filter((l) => l.trim().length > 0),
                      })
                    }
                  />
                </div>
              ))}
              <button className="admin-btn admin-btn--add" onClick={addProject}>
                + Add Project
              </button>
            </div>
          )}

          {tab === 'Contact' && (
            <div className="admin-section">
              <label className="admin-label">Intro text</label>
              <textarea
                className="admin-textarea"
                rows={3}
                value={content.contact.intro}
                onChange={(e) =>
                  updateField('contact', 'intro', e.target.value)
                }
              />

              <label className="admin-label" style={{ marginTop: '1rem' }}>Timezone</label>
              <input
                className="admin-input"
                value={content.contact.timezone || 'auto'}
                placeholder="auto or e.g. America/Los_Angeles"
                onChange={(e) => updateField('contact', 'timezone', e.target.value || 'auto')}
              />

              <label className="admin-label" style={{ marginTop: '1.25rem' }}>
                Social / Contact Links
              </label>
              {content.contact.links.map((link, i) => (
                <div key={i} className="admin-card">
                  <div className="admin-card-head">
                    <span className="admin-card-num">#{i + 1}</span>
                    <button
                      className="admin-btn admin-btn--danger"
                      onClick={() => {
                        const next = content.contact.links.filter((_, idx) => idx !== i);
                        updateField('contact', 'links', next);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="admin-row">
                    <div>
                      <label className="admin-label">Type (icon)</label>
                      <select
                        className="admin-input"
                        value={link.type}
                        onChange={(e) => {
                          const next = [...content.contact.links];
                          next[i] = { ...link, type: e.target.value };
                          updateField('contact', 'links', next);
                        }}
                      >
                        {SOCIAL_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="admin-label">Label</label>
                      <input
                        className="admin-input"
                        value={link.label}
                        onChange={(e) => {
                          const next = [...content.contact.links];
                          next[i] = { ...link, label: e.target.value };
                          updateField('contact', 'links', next);
                        }}
                      />
                    </div>
                  </div>
                  <label className="admin-label">Display value (visible text)</label>
                  <input
                    className="admin-input"
                    value={link.value}
                    onChange={(e) => {
                      const next = [...content.contact.links];
                      next[i] = { ...link, value: e.target.value };
                      updateField('contact', 'links', next);
                    }}
                  />
                  <label className="admin-label">URL (where it links to)</label>
                  <input
                    className="admin-input"
                    value={link.url}
                    placeholder={link.type === 'email' ? 'mailto:you@example.com' : 'https://...'}
                    onChange={(e) => {
                      const next = [...content.contact.links];
                      next[i] = { ...link, url: e.target.value };
                      updateField('contact', 'links', next);
                    }}
                  />
                </div>
              ))}
              <button
                className="admin-btn admin-btn--add"
                onClick={() => {
                  const next = [
                    ...content.contact.links,
                    { type: 'github', label: 'New Link', value: '', url: '' },
                  ];
                  updateField('contact', 'links', next);
                }}
              >
                + Add Contact Link
              </button>
            </div>
          )}

          {tab === 'Data' && (
            <div className="admin-section">
              <p className="admin-note">
                All changes save automatically to your browser. Export a backup JSON, or import one to sync between devices.
              </p>
              <div className="admin-data-actions">
                <button className="admin-btn" onClick={exportJson}>
                  Export JSON
                </button>
                <button
                  className="admin-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Import JSON
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json"
                  onChange={importJson}
                  style={{ display: 'none' }}
                />
                <button
                  className="admin-btn admin-btn--danger"
                  onClick={() => {
                    if (confirm('Reset everything to defaults? Your changes will be lost.')) {
                      reset();
                    }
                  }}
                >
                  Reset to Defaults
                </button>
              </div>
              {importError && <p className="admin-error">{importError}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
