import React, { useState } from 'react';
import { useContent } from '../hooks/useContent';
import { SOCIAL_ICONS, ArrowIcon } from './Icons';
import CopyEmailButton from './polish/CopyEmailButton';
import TimezonePill from './polish/TimezonePill';
import { showToast } from './polish/Toast';

const MAX_MESSAGE = 500;

const Field = ({ label, name, type = 'text', value, onChange, rows, maxLength, showCount }) => {
  const [focused, setFocused] = useState(false);
  const filled = value && value.length > 0;
  const Comp = rows ? 'textarea' : 'input';
  const className = rows ? 'contact__textarea' : 'contact__input';
  const fieldClass = `contact__field${focused ? ' contact__field--focused' : ''}${
    filled ? ' contact__field--filled' : ''
  }`;
  return (
    <div className={fieldClass}>
      <Comp
        className={className}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        rows={rows}
        maxLength={maxLength}
      />
      <span className="contact__float-label">{label}</span>
      {showCount && (
        <span className="contact__char-count">
          {value.length}/{maxLength}
        </span>
      )}
    </div>
  );
};

const Contact = () => {
  const { content } = useContent();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle');

  const emailLink = content.contact.links.find((l) => l.type === 'email');
  const emailAddress = emailLink?.url?.replace(/^mailto:/, '') || emailLink?.value || '';

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      showToast('Please fill in all fields');
      return;
    }
    setStatus('success');
    showToast('Message sent (demo)');
    setFormData({ name: '', email: '', message: '' });
    setTimeout(() => setStatus('idle'), 2800);
  };

  return (
    <section id="contact" className="section">
      <div className="contact__inner animate-on-scroll">
        <p className="section__label">05 — Contact</p>
        <h2 className="section__title">Get In Touch</h2>
        <p className="contact__intro">{content.contact.intro}</p>

        <div className="contact__meta-row">
          <TimezonePill timezone={content.contact.timezone} />
          <CopyEmailButton email={emailAddress} />
        </div>

        <form className="contact__form" onSubmit={handleSubmit}>
          <Field label="Your Name" name="name" value={formData.name} onChange={handleChange} />
          <Field
            label="Your Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
          />
          <Field
            label="Your Message"
            name="message"
            rows={5}
            value={formData.message}
            onChange={handleChange}
            maxLength={MAX_MESSAGE}
            showCount
          />
          <button
            type="submit"
            className={`btn-glass btn-magnetic contact__submit${
              status === 'success' ? ' contact__submit--success' : ''
            }`}
          >
            {status === 'success' ? '✓ Message sent' : 'Send Message'}
          </button>
        </form>

        <div className="contact__links-section">
          <p className="contact__connect-label">Connect Directly</p>
          <div className="contact__links">
            {content.contact.links.map((link, i) => {
              const Icon = SOCIAL_ICONS[link.type];
              return (
                <a
                  key={i}
                  href={link.url}
                  target={link.type === 'email' ? undefined : '_blank'}
                  rel="noopener noreferrer"
                  className="contact__link-card"
                >
                  <div className="contact__link-icon">
                    {Icon ? <Icon size={22} /> : null}
                  </div>
                  <div className="contact__link-info">
                    <span className="contact__link-label">{link.label}</span>
                    <span className="contact__link-value">{link.value}</span>
                  </div>
                  <div className="contact__link-arrow">
                    <ArrowIcon size={18} />
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
