import React, { useState } from 'react';

const contactLinks = [
  { label: 'Email Me', href: '#' },
  { label: 'GitHub', href: '#' },
  { label: 'LinkedIn', href: '#' },
];

const Contact = () => {
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
    // Placeholder — wire to Formspree or EmailJS later
    setStatus({ type: 'success', text: 'Message sent! (Demo — not yet connected)' });
    setFormData({ name: '', email: '', message: '' });
    setTimeout(() => setStatus(null), 4000);
  };

  return (
    <section id="contact" className="section">
      <div className="contact__inner animate-on-scroll">
        <h2 className="section__title">Get In Touch</h2>
        <p className="contact__intro">
          I'm always open to new opportunities and collaborations. Feel free to
          reach out if you'd like to work together!
        </p>

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

        <div className="contact__links">
          {contactLinks.map((link, index) => (
            <a key={index} href={link.href} className="btn-glass">
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Contact;
