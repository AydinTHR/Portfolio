// src/components/ContourBackground.jsx
import React, { useEffect, useRef } from 'react';
import SimplexNoise from '../utils/SimplexNoise';

const ContourBackground = () => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, tx: -1000, ty: -1000 });
  const pulsesRef = useRef([]);
  const runIdRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const noise = new SimplexNoise(20251003);
    const currentRunId = ++runIdRef.current;
    const params = {
      lineWidth: 1.2,
      levels: 7,
      scale: 400,
      speed: 0.8,
      smooth: 1,
      gridStep: 4,
      mouseRadius: 120,
      mouseStrength: 1.8
    };
    let time = 0, atime = 0, last = performance.now();

    const fit = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;
      if (width === 0 || height === 0) return;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    const field = (x, y, t) => {
      const s = params.scale;
      const n1 = noise.noise2D(x / s + t * 0.07, y / s + t * 0.05);
      const n2 = 0.5 * noise.noise2D(x / (s * 0.45) - t * 0.03, y / (s * 0.5) + 100 + t * 0.02);
      let base = (n1 + n2) * 0.75;

      const mouse = mouseRef.current;
      const dx = x - mouse.x;
      const dy = y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < params.mouseRadius) {
        const influence = (1 - dist / params.mouseRadius);
        const repel = Math.pow(influence, 2) * params.mouseStrength;
        base -= repel;
      }

      for (let pulse of pulsesRef.current) {
        const pdx = x - pulse.x;
        const pdy = y - pulse.y;
        const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
        const waveSpeed = 200;
        const waveRadius = pulse.time * waveSpeed;
        const waveWidth = 100;
        const distFromWave = Math.abs(pdist - waveRadius);

        if (distFromWave < waveWidth) {
          const waveInfluence = 1 - distFromWave / waveWidth;
          const decay = 1 - pulse.time / pulse.maxTime;
          const amplitude = 0.8 * waveInfluence * decay;
          base += amplitude * Math.sin(waveInfluence * Math.PI);
        }
      }

      return base;
    };

    const drawContours = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (w === 0 || h === 0) return;
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      const step = params.gridStep;
      const cols = Math.ceil(w / step) + 2, rows = Math.ceil(h / step) + 2;
      const grid = new Array(rows);

      for (let j = 0; j < rows; j++) {
        const y = j * step;
        const row = new Float32Array(cols);
        for (let i = 0; i < cols; i++) {
          const x = i * step;
          row[i] = field(x, y, atime);
        }
        grid[j] = row;
      }

      ctx.lineWidth = params.lineWidth;
      ctx.strokeStyle = '#fff';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let L = 0; L < params.levels; L++) {
        const iso = -1 + (2 * L) / (params.levels - 1);
        ctx.globalAlpha = 0.55;
        ctx.beginPath();

        for (let j = 0; j < rows - 1; j++) {
          for (let i = 0; i < cols - 1; i++) {
            const a = grid[j][i], b = grid[j][i + 1], c = grid[j + 1][i + 1], d = grid[j + 1][i];
            const ax = i * step, ay = j * step;
            let idx = 0;
            if (a > iso) idx |= 1;
            if (b > iso) idx |= 2;
            if (c > iso) idx |= 4;
            if (d > iso) idx |= 8;
            if (idx === 0 || idx === 15) continue;

            const lerp = (v1, v2) => (iso - v1) / (v2 - v1 + 1e-6);
            const xL = ax, yL = ay + step * lerp(a, d);
            const xR = ax + step, yR = ay + step * lerp(b, c);
            const xT = ax + step * lerp(a, b), yT = ay;
            const xB = ax + step * lerp(d, c), yB = ay + step;
            const mid = (p1, p2) => ({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 });

            switch (idx) {
              case 1: case 14: {
                const p1 = { x: xL, y: yL }, p2 = { x: xT, y: yT };
                const m = mid(p1, p2);
                ctx.moveTo(p1.x, p1.y);
                ctx.quadraticCurveTo(m.x, m.y, p2.x, p2.y);
                break;
              }
              case 2: case 13: {
                const p1 = { x: xT, y: yT }, p2 = { x: xR, y: yR };
                const m = mid(p1, p2);
                ctx.moveTo(p1.x, p1.y);
                ctx.quadraticCurveTo(m.x, m.y, p2.x, p2.y);
                break;
              }
              case 3: case 12: {
                const p1 = { x: xL, y: yL }, p2 = { x: xR, y: yR };
                const m = mid(p1, p2);
                ctx.moveTo(p1.x, p1.y);
                ctx.quadraticCurveTo(m.x, m.y, p2.x, p2.y);
                break;
              }
              case 4: case 11: {
                const p1 = { x: xR, y: yR }, p2 = { x: xB, y: yB };
                const m = mid(p1, p2);
                ctx.moveTo(p1.x, p1.y);
                ctx.quadraticCurveTo(m.x, m.y, p2.x, p2.y);
                break;
              }
              case 5: {
                const p1 = { x: xT, y: yT }, p2 = { x: xR, y: yR };
                const m1 = mid(p1, p2);
                ctx.moveTo(p1.x, p1.y);
                ctx.quadraticCurveTo(m1.x, m1.y, p2.x, p2.y);
                const p3 = { x: xL, y: yL }, p4 = { x: xB, y: yB };
                const m2 = mid(p3, p4);
                ctx.moveTo(p3.x, p3.y);
                ctx.quadraticCurveTo(m2.x, m2.y, p4.x, p4.y);
                break;
              }
              case 6: case 9: {
                const p1 = { x: xT, y: yT }, p2 = { x: xB, y: yB };
                const m = mid(p1, p2);
                ctx.moveTo(p1.x, p1.y);
                ctx.quadraticCurveTo(m.x, m.y, p2.x, p2.y);
                break;
              }
              case 7: case 8: {
                const p1 = { x: xL, y: yL }, p2 = { x: xB, y: yB };
                const m = mid(p1, p2);
                ctx.moveTo(p1.x, p1.y);
                ctx.quadraticCurveTo(m.x, m.y, p2.x, p2.y);
                break;
              }
              case 10: {
                const p1 = { x: xT, y: yT }, p2 = { x: xL, y: yL };
                const m1 = mid(p1, p2);
                ctx.moveTo(p1.x, p1.y);
                ctx.quadraticCurveTo(m1.x, m1.y, p2.x, p2.y);
                const p3 = { x: xR, y: yR }, p4 = { x: xB, y: yB };
                const m2 = mid(p3, p4);
                ctx.moveTo(p3.x, p3.y);
                ctx.quadraticCurveTo(m2.x, m2.y, p4.x, p4.y);
                break;
              }
            }
          }
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    const raf = (now) => {
      if (runIdRef.current !== currentRunId) return;
      if (!Number.isFinite(now)) now = performance.now();
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      time += dt * params.speed;
      const smoothFactor = params.smooth >= 1 ? 1 : (1 - Math.pow(1 - params.smooth, 60 * dt));
      atime += (time - atime) * smoothFactor;

      const smoothness = 0.85;
      const mouse = mouseRef.current;
      mouse.x += (mouse.tx - mouse.x) * (1 - Math.pow(smoothness, 60 * dt));
      mouse.y += (mouse.ty - mouse.y) * (1 - Math.pow(smoothness, 60 * dt));

      for (let i = pulsesRef.current.length - 1; i >= 0; i--) {
        pulsesRef.current[i].time += dt;
        if (pulsesRef.current[i].time > pulsesRef.current[i].maxTime) {
          pulsesRef.current.splice(i, 1);
        }
      }

      drawContours();
      requestAnimationFrame(raf);
    };

    fit();
    last = performance.now();
    window.addEventListener('resize', fit);
    document.addEventListener('fullscreenchange', fit);
    document.addEventListener('webkitfullscreenchange', fit);
    document.addEventListener('mozfullscreenchange', fit);
    document.addEventListener('MSFullscreenChange', fit);

    const handleMouseMove = (e) => {
      mouseRef.current.tx = e.clientX;
      mouseRef.current.ty = e.clientY;
    };

    const handleMouseLeave = () => {
      mouseRef.current.tx = -1000;
      mouseRef.current.ty = -1000;
    };

    const handleClick = (e) => {
      const x = e.clientX;
      const y = e.clientY;
      pulsesRef.current.push({ x, y, time: 0, maxTime: 3.5 });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('click', handleClick);

    requestAnimationFrame(raf);

    return () => {
      runIdRef.current++;
      window.removeEventListener('resize', fit);
      document.removeEventListener('fullscreenchange', fit);
      document.removeEventListener('webkitfullscreenchange', fit);
      document.removeEventListener('mozfullscreenchange', fit);
      document.removeEventListener('MSFullscreenChange', fit);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'auto'
      }}
    />
  );
};

export default ContourBackground;
