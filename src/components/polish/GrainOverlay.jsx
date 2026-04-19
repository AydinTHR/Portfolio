import React from 'react';

const SVG = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'>
    <filter id='n'>
      <feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/>
      <feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.45 0'/>
    </filter>
    <rect width='100%' height='100%' filter='url(#n)' opacity='0.55'/>
  </svg>`
);

const GrainOverlay = () => (
  <div
    className="grain-overlay"
    aria-hidden="true"
    style={{ backgroundImage: `url("data:image/svg+xml;utf8,${SVG}")` }}
  />
);

export default GrainOverlay;
