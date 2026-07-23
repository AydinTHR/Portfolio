import React from 'react';
import Monogram from './Monogram';

const Footer = () => {
  return (
    <footer className="footer">
      <Monogram size={44} className="footer__mark" />
      <p>&copy; {new Date().getFullYear()} Aydin. Built with passion and code.</p>
    </footer>
  );
};

export default Footer;
