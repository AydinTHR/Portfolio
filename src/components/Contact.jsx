import React, { useState } from 'react';
import { useContent } from '../hooks/useContent';
import { SOCIAL_ICONS, ArrowIcon } from './Icons';

const Contact = () => {
  const { content } = useContent();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setStatus({ type: 'error', text: 'Please fill in all fields.' });
      return;
    }
    setStatus({ type: 'success', text: 'Message sent! (Demo — not yet connected)' });
    setFormData({ name: '', email: '', message: '' });
    setTimeout(() => setStatus(null), 4000);
  };

  return (
    <section id="contact" className="section">
      <div className="contact__inner animate-on-scroll">
        <p className="section__label">04 — Contact</p>
        <h2 className="section__title">Get In Touch</h2>
        <p className="contact__intro">{content.contact.intro}</p>

        <form className="contact__form" onSubmit={handleSubmit}>
          <input
            className="contact__input"
            type="text"
            name="name"
            placeholder="Your Name"
            value={formData.name}
            onChange={handleChange}
          />
          <input
            className="contact__input"
            type="email"
            name="email"
            placeholder="Your Email"
            value={formData.email}
            onChange={handleChange}
          />
          <textarea
            className="contact__textarea"
            name="message"
            placeholder="Your Message"
            value={formData.message}
            onChange={handleChange}
          />
          <button type="submit" className="btn-glass" style={{ width: '100%' }}>
            Send Message
          </button>
          {status && (
            <p className={`contact__form-status contact__form-status--${status.type}`}>
              {status.text}
            </p>
          )}
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
