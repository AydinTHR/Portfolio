import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useContent, refreshContent } from '../hooks/useContent';
import { defaults } from '../data/defaults';
import { api, resolveAssetUrl } from '../lib/api';
import { showToast } from './polish/Toast';

const TABS = ['Hero', 'About', 'Skills', 'Experience', 'Projects', 'Contact', 'Messages', 'Analytics', 'Data'];
const SOCIAL_TYPES = ['email', 'github', 'linkedin', 'twitter', 'instagram'];

// Mongo stores timestamps in UTC without an explicit offset; normalize before parsing.
const parseUtcDate = (value) => {
  if (!value) return null;
  const iso = /Z$|[+-]\d\d:\d\d$/.test(value) ? value : `${value}Z`;
  return new Date(iso);
};

const LoginGate = ({ onAuthed }) => {
  const [creds, setCreds] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await api.login(creds.email, creds.password);
      onAuthed();
    } catch (err) {
      setError(
        err?.status === 429
          ? 'Too many attempts — wait a minute and try again.'
          : 'Invalid email or password.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="admin-login" onSubmit={submit}>
      <p className="admin-note">Sign in to edit the site, read messages, and view analytics.</p>
      <label className="admin-label">Email</label>
      <input
        className="admin-input"
        type="email"
        autoComplete="username"
        value={creds.email}
        onChange={(e) => setCreds((c) => ({ ...c, email: e.target.value }))}
      />
      <label className="admin-label">Password</label>
      <input
        className="admin-input"
        type="password"
        autoComplete="current-password"
        value={creds.password}
        onChange={(e) => setCreds((c) => ({ ...c, password: e.target.value }))}
      />
      {error && <p className="admin-error">{error}</p>}
      <button className="admin-btn admin-btn--primary" type="submit" disabled={busy}>
        {busy ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  );
};

const MessagesTab = () => {
  const [messages, setMessages] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api
      .getMessages()
      .then(setMessages)
      .catch(() => setError('Could not load messages.'));
  }, []);

  useEffect(load, [load]);

  const toggleRead = async (m) => {
    try {
      const updated = await api.setMessageRead(m.id, !m.read);
      setMessages((list) => list.map((x) => (x.id === m.id ? updated : x)));
    } catch {
      showToast('Could not update message');
    }
  };

  const remove = async (m) => {
    if (!confirm(`Delete the message from ${m.name}?`)) return;
    try {
      await api.deleteMessage(m.id);
      setMessages((list) => list.filter((x) => x.id !== m.id));
    } catch {
      showToast('Could not delete message');
    }
  };

  if (error) return <p className="admin-error">{error}</p>;
  if (!messages) return <p className="admin-note">Loading messages…</p>;
  if (!messages.length) return <p className="admin-note">No messages yet.</p>;

  return (
    <div className="admin-section">
      {messages.map((m) => (
        <div key={m.id} className={`admin-card admin-msg${m.read ? '' : ' admin-msg--unread'}`}>
          <div className="admin-card-head">
            <div className="admin-msg-meta">
              <strong>{m.name}</strong>
              <a href={`mailto:${m.email}`}>{m.email}</a>
              <span>{parseUtcDate(m.created_at)?.toLocaleString()}</span>
            </div>
            <div className="admin-msg-actions">
              <button className="admin-btn" onClick={() => toggleRead(m)}>
                {m.read ? 'Mark unread' : 'Mark read'}
              </button>
              <button className="admin-btn admin-btn--danger" onClick={() => remove(m)}>
                Delete
              </button>
            </div>
          </div>
          <p className="admin-msg-body">{m.message}</p>
        </div>
      ))}
    </div>
  );
};

const AnalyticsTab = () => {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getAnalyticsSummary()
      .then(setSummary)
      .catch(() => setError('Could not load analytics.'));
  }, []);

  if (error) return <p className="admin-error">{error}</p>;
  if (!summary) return <p className="admin-note">Loading analytics…</p>;

  const cards = [
    { label: 'Total views', value: summary.total_views },
    { label: 'Last 7 days', value: summary.views_7d },
    { label: 'Last 30 days', value: summary.views_30d },
    { label: 'Unique visitors (30d)', value: summary.unique_visitors },
  ];

  return (
    <div className="admin-section">
      <div className="admin-stats-grid">
        {cards.map((c) => (
          <div key={c.label} className="admin-stat-card">
            <span className="admin-stat-value">{c.value.toLocaleString()}</span>
            <span className="admin-stat-label">{c.label}</span>
          </div>
        ))}
      </div>

      <label className="admin-label" style={{ marginTop: '1.25rem' }}>Top sections (30d)</label>
      {summary.top_sections.length ? (
        summary.top_sections.map((s) => (
          <div key={s.section} className="admin-list-row">
            <span>{s.section}</span>
            <span>{s.count.toLocaleString()}</span>
          </div>
        ))
      ) : (
        <p className="admin-note">No section data yet.</p>
      )}

      <label className="admin-label" style={{ marginTop: '1.25rem' }}>
        Devices (visits per visitor, your own visits excluded)
      </label>
      {summary.visitors?.length ? (
        summary.visitors.map((v, i) => (
          <div key={i} className="admin-list-row">
            <span>{v.device}</span>
            <span className="admin-visitor-meta">
              {v.visits.toLocaleString()} {v.visits === 1 ? 'visit' : 'visits'}
              <span className="admin-visitor-last">
                · last {parseUtcDate(v.last_seen)?.toLocaleDateString()}
              </span>
            </span>
          </div>
        ))
      ) : (
        <p className="admin-note">No visitors recorded yet.</p>
      )}

      <label className="admin-label" style={{ marginTop: '1.25rem' }}>Views per day (14d)</label>
      {summary.recent_days.length ? (
        <div className="admin-chart" role="img" aria-label="Daily page views, last 14 days">
          {(() => {
            const max = Math.max(...summary.recent_days.map((d) => d.views), 1);
            return summary.recent_days.map((d) => (
              <div key={d.date} className="admin-chart-col" title={`${d.date}: ${d.views} views`}>
                <span className="admin-chart-count">{d.views > 0 ? d.views : ''}</span>
                <div
                  className="admin-chart-bar"
                  style={{ height: `${Math.max((d.views / max) * 100, 2)}%` }}
                />
                <span className="admin-chart-day">{d.date.slice(8)}</span>
              </div>
            ));
          })()}
        </div>
      ) : (
        <p className="admin-note">No views recorded yet.</p>
      )}
    </div>
  );
};

const VersionsList = ({ onRestored }) => {
  const [versions, setVersions] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    api
      .getVersions()
      .then(setVersions)
      .catch(() => setVersions([]));
  }, []);

  const restore = async (v) => {
    if (!confirm(`Restore the version from ${parseUtcDate(v.archived_at)?.toLocaleString()}? The current version is archived first.`)) {
      return;
    }
    setBusyId(v.id);
    try {
      const restored = await api.restoreVersion(v.id);
      onRestored(restored);
      const next = await api.getVersions();
      setVersions(next);
      showToast('Version restored — now live');
    } catch {
      showToast('Restore failed — please try again');
    } finally {
      setBusyId(null);
    }
  };

  if (!versions) return <p className="admin-note">Loading versions…</p>;
  if (!versions.length) {
    return <p className="admin-note">No published versions yet — publish once to start history.</p>;
  }

  return (
    <div className="admin-versions">
      {versions.map((v) => (
        <div key={v.id} className="admin-list-row admin-version-row">
          <span>
            {parseUtcDate(v.archived_at)?.toLocaleString()}
            {v.label ? ` — ${v.label}` : ''}
          </span>
          <button
            className="admin-btn"
            disabled={busyId === v.id}
            onClick={() => restore(v)}
          >
            {busyId === v.id ? 'Restoring…' : 'Restore'}
          </button>
        </div>
      ))}
    </div>
  );
};

const AdminPanel = ({ open, onClose }) => {
  const { content, update } = useContent();
  const [authed, setAuthed] = useState(null); // null = checking, false, true
  const [draft, setDraft] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftState, setDraftState] = useState('idle'); // idle | saving | saved
  const [tab, setTab] = useState('Hero');
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const draftRestored = useRef(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Check the session whenever the panel opens.
  useEffect(() => {
    if (!open) return;
    setAuthed(null);
    api
      .me()
      .then((s) => setAuthed(Boolean(s.authenticated)))
      .catch(() => setAuthed(false));
  }, [open]);

  // Start a fresh draft from published content when opening; while the draft is
  // clean, keep it in sync with content arriving from the API.
  useEffect(() => {
    if (open && !dirty) {
      setDraft(JSON.parse(JSON.stringify(content)));
    }
  }, [open, content, dirty]);

  // Once authenticated, restore any unpublished server draft from a previous session.
  useEffect(() => {
    if (!open || authed !== true || draftRestored.current) return;
    draftRestored.current = true;
    api
      .getDraft()
      .then((res) => {
        if (res.exists && res.content) {
          setDraft(res.content);
          setDirty(true);
          showToast('Restored unpublished draft');
        }
      })
      .catch(() => {});
  }, [open, authed]);

  // Reset the restore guard when the panel closes so reopening checks again.
  useEffect(() => {
    if (!open) draftRestored.current = false;
  }, [open]);

  // Autosave the working draft to the server, debounced after the last edit.
  useEffect(() => {
    if (!open || !authed || !dirty || !draft) return;
    setDraftState('saving');
    const timer = setTimeout(() => {
      api
        .saveDraft(draft)
        .then(() => setDraftState('saved'))
        .catch(() => setDraftState('idle'));
    }, 1500);
    return () => clearTimeout(timer);
  }, [open, authed, dirty, draft]);

  if (!open) return null;

  const publish = async () => {
    if (saving || !draft) return;
    setSaving(true);
    try {
      await update(draft);
      setDirty(false);
      setDraftState('idle'); // publish consumes the server draft
      showToast('Published — changes are live');
    } catch (err) {
      if (err?.status === 401) {
        setAuthed(false);
        showToast('Session expired — please sign in again');
      } else {
        showToast('Publish failed — please try again');
      }
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      /* session may already be gone */
    }
    setAuthed(false);
  };

  const patch = (section, value) => {
    setDraft((d) => ({ ...d, [section]: value }));
    setDirty(true);
  };

  const updateField = (section, field, value) => {
    patch(section, { ...draft[section], [field]: value });
  };

  const updateListItem = (section, index, newItem) => {
    const list = [...draft[section]];
    list[index] = newItem;
    patch(section, list);
  };

  const removeListItem = (section, index) => {
    patch(section, draft[section].filter((_, i) => i !== index));
  };

  const addSkill = () => {
    patch('skills', [
      ...draft.skills,
      { title: 'New Skill', description: 'Description', technologies: ['Tech 1'], proficiency: 75 },
    ]);
  };

  const addProject = () => {
    const num = String(draft.projects.length + 1).padStart(2, '0');
    patch('projects', [
      ...draft.projects,
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
    updateField('about', 'stats', [...(draft.about.stats || []), { label: 'New stat', value: 0 }]);
  };

  const removeStat = (i) => {
    updateField(
      'about',
      'stats',
      (draft.about.stats || []).filter((_, idx) => idx !== i)
    );
  };

  const uploadTo = async (file, assign) => {
    try {
      const { url } = await api.uploadImage(file);
      assign(url);
      showToast('Image uploaded');
    } catch (err) {
      showToast(
        err?.status === 413
          ? 'Image too large (max 5 MB)'
          : err?.status === 415
            ? 'Unsupported image type'
            : 'Upload failed — please try again'
      );
    }
  };

  const onImageUpload = (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    uploadTo(file, (url) => updateField('about', 'profileImage', url));
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' });
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
        setDraft((d) => ({
          ...d,
          hero: { ...defaults.hero, ...(parsed.hero || {}) },
          about: { ...defaults.about, ...(parsed.about || {}) },
          skills: Array.isArray(parsed.skills) ? parsed.skills : defaults.skills,
          projects: Array.isArray(parsed.projects) ? parsed.projects : defaults.projects,
          experience: Array.isArray(parsed.experience) ? parsed.experience : d.experience,
          contact: parsed.contact ? { ...defaults.contact, ...parsed.contact } : d.contact,
        }));
        setDirty(true);
        setImportError('');
      } catch {
        setImportError('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const renderBody = () => {
    if (authed === null) {
      return <p className="admin-note">Checking session…</p>;
    }
    if (!authed) {
      return <LoginGate onAuthed={() => setAuthed(true)} />;
    }
    if (!draft) return null;

    return (
      <>
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
                value={draft.hero.greeting}
                onChange={(e) => updateField('hero', 'greeting', e.target.value)}
              />

              <label className="admin-label">Name</label>
              <input
                className="admin-input"
                value={draft.hero.name}
                onChange={(e) => updateField('hero', 'name', e.target.value)}
              />

              <label className="admin-label">Rotating subtitles (one per line)</label>
              <textarea
                className="admin-textarea"
                rows={4}
                value={draft.hero.subtitles.join('\n')}
                onChange={(e) =>
                  updateField('hero', 'subtitles', e.target.value.split('\n').filter(Boolean))
                }
              />
            </div>
          )}

          {tab === 'About' && (
            <div className="admin-section">
              <label className="admin-label">Profile image</label>
              <div className="admin-image-row">
                <div className="admin-image-preview">
                  {draft.about.profileImage ? (
                    <img src={resolveAssetUrl(draft.about.profileImage)} alt="profile" />
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
                  {draft.about.profileImage && (
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
                value={draft.about.paragraphs.join('\n')}
                onChange={(e) =>
                  updateField(
                    'about',
                    'paragraphs',
                    e.target.value.split('\n').filter((p) => p.trim().length > 0)
                  )
                }
              />

              <label className="admin-label" style={{ marginTop: '1.25rem' }}>Stat chips</label>
              {(draft.about.stats || []).map((stat, i) => (
                <div key={i} className="admin-row">
                  <div>
                    <label className="admin-sublabel">Label</label>
                    <input
                      className="admin-input"
                      value={stat.label}
                      onChange={(e) => {
                        const next = [...(draft.about.stats || [])];
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
                        const next = [...(draft.about.stats || [])];
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
              {draft.skills.map((skill, i) => (
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
              {(draft.experience || []).map((exp, i) => (
                <div key={i} className="admin-card">
                  <div className="admin-card-head">
                    <span className="admin-card-num">#{i + 1}</span>
                    <button
                      className="admin-btn admin-btn--danger"
                      onClick={() => {
                        patch('experience', (draft.experience || []).filter((_, idx) => idx !== i));
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
                      const next = [...draft.experience];
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
                          const next = [...draft.experience];
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
                          const next = [...draft.experience];
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
                          const next = [...draft.experience];
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
                          const next = [...draft.experience];
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
                          const next = [...draft.experience];
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
                          const next = [...draft.experience];
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
                      const next = [...draft.experience];
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
                      const next = [...draft.experience];
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
                  patch('experience', [
                    ...(draft.experience || []),
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
                  ]);
                }}
              >
                + Add Experience
              </button>
            </div>
          )}

          {tab === 'Projects' && (
            <div className="admin-section">
              {draft.projects.map((project, i) => (
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
                  <label className="admin-label">Image (URL or upload)</label>
                  <div className="admin-image-url-row">
                    <input
                      className="admin-input"
                      value={project.image || ''}
                      placeholder="https://... (leave blank for no image)"
                      onChange={(e) =>
                        updateListItem('projects', i, { ...project, image: e.target.value })
                      }
                    />
                    <label className="admin-btn admin-upload-btn">
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          e.target.value = '';
                          if (!file) return;
                          uploadTo(file, (url) =>
                            updateListItem('projects', i, { ...project, image: url })
                          );
                        }}
                      />
                    </label>
                  </div>
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
                value={draft.contact.intro}
                onChange={(e) => updateField('contact', 'intro', e.target.value)}
              />

              <label className="admin-label" style={{ marginTop: '1rem' }}>Timezone</label>
              <input
                className="admin-input"
                value={draft.contact.timezone || 'auto'}
                placeholder="auto or e.g. America/Los_Angeles"
                onChange={(e) => updateField('contact', 'timezone', e.target.value || 'auto')}
              />

              <label className="admin-label" style={{ marginTop: '1.25rem' }}>
                Social / Contact Links
              </label>
              {draft.contact.links.map((link, i) => (
                <div key={i} className="admin-card">
                  <div className="admin-card-head">
                    <span className="admin-card-num">#{i + 1}</span>
                    <button
                      className="admin-btn admin-btn--danger"
                      onClick={() => {
                        const next = draft.contact.links.filter((_, idx) => idx !== i);
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
                          const next = [...draft.contact.links];
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
                          const next = [...draft.contact.links];
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
                      const next = [...draft.contact.links];
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
                      const next = [...draft.contact.links];
                      next[i] = { ...link, url: e.target.value };
                      updateField('contact', 'links', next);
                    }}
                  />
                </div>
              ))}
              <button
                className="admin-btn admin-btn--add"
                onClick={() => {
                  updateField('contact', 'links', [
                    ...draft.contact.links,
                    { type: 'github', label: 'New Link', value: '', url: '' },
                  ]);
                }}
              >
                + Add Contact Link
              </button>
            </div>
          )}

          {tab === 'Messages' && <MessagesTab />}

          {tab === 'Analytics' && <AnalyticsTab />}

          {tab === 'Data' && (
            <div className="admin-section">
              <p className="admin-note">
                Edits autosave to a server-side draft and stay private until you hit Publish,
                which makes them live for every visitor. Export a backup JSON, or import one to
                restore.
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
                  className="admin-btn admin-btn--ghost"
                  onClick={async () => {
                    if (!confirm('Discard the unpublished draft and return to the live version?')) return;
                    try {
                      await api.deleteDraft();
                    } catch {
                      /* draft may not exist server-side */
                    }
                    setDraft(JSON.parse(JSON.stringify(content)));
                    setDirty(false);
                    setDraftState('idle');
                    showToast('Draft discarded');
                  }}
                >
                  Discard Draft
                </button>
                <button
                  className="admin-btn admin-btn--danger"
                  onClick={() => {
                    if (confirm('Reset the draft to the original defaults? Publish afterwards to make it live.')) {
                      setDraft(JSON.parse(JSON.stringify(defaults)));
                      setDirty(true);
                    }
                  }}
                >
                  Reset to Defaults
                </button>
              </div>
              {importError && <p className="admin-error">{importError}</p>}

              <label className="admin-label" style={{ marginTop: '1.75rem' }}>
                Published versions (latest 10)
              </label>
              <p className="admin-note">
                Every publish archives the previous version. Restore puts an old version back live.
              </p>
              <VersionsList
                onRestored={(restored) => {
                  refreshContent(restored);
                  setDraft(JSON.parse(JSON.stringify(restored)));
                  setDirty(false);
                  setDraftState('idle');
                }}
              />
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-panel" onClick={(e) => e.stopPropagation()}>
        <header className="admin-header">
          <h2 className="admin-title">
            Portfolio Editor
            {authed && dirty && <span className="admin-dirty-dot" title="Unpublished changes" />}
          </h2>
          <div className="admin-header-actions">
            {authed && (
              <>
                {dirty && (
                  <span className="admin-draft-state">
                    {draftState === 'saving'
                      ? 'Saving draft…'
                      : draftState === 'saved'
                        ? 'Draft saved'
                        : ''}
                  </span>
                )}
                <button
                  className="admin-btn admin-btn--primary"
                  onClick={publish}
                  disabled={saving || !dirty}
                >
                  {saving ? 'Publishing…' : dirty ? 'Publish' : 'Published'}
                </button>
                <button className="admin-btn admin-btn--ghost" onClick={logout}>
                  Log out
                </button>
              </>
            )}
            <button className="admin-close" onClick={onClose} aria-label="Close">×</button>
          </div>
        </header>
        {renderBody()}
      </div>
    </div>
  );
};

export default AdminPanel;
