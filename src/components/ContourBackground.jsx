// src/components/ContourBackground.jsx
import React, { useEffect, useRef } from 'react';
import SimplexNoise from '../utils/SimplexNoise';

const lerp = (v1, v2, iso) => (iso - v1) / (v2 - v1 + 1e-6);

// Main-thread fallback for browsers without OffscreenCanvas
function runMainThreadAnimation(canvas, mouseRef, pulsesRef, runIdRef) {
  const ctx = canvas.getContext('2d');
  const noise = new SimplexNoise(20251003);
  const currentRunId = ++runIdRef.current;
  const params = {
    lineWidth: 1.2, levels: 7, scale: 400, speed: 0.8,
    smooth: 1, gridStep: 4, mouseRadius: 120, mouseStrength: 1.8
  };
  const invScale = 1 / params.scale;
  const invScaleSmall = 1 / (params.scale * 0.45);
  const invScaleSmallY = 1 / (params.scale * 0.5);
  const mouseRadiusSq = params.mouseRadius * params.mouseRadius;
  let time = 0, atime = 0, last = performance.now();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const fit = () => {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth, h = window.innerHeight;
    if (w === 0 || h === 0) return;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  };

  const field = (x, y, t) => {
    const n1 = noise.noise2D(x * invScale + t * 0.07, y * invScale + t * 0.05);
    const n2 = 0.5 * noise.noise2D(x * invScaleSmall - t * 0.03, y * invScaleSmallY + 100 + t * 0.02);
    let base = (n1 + n2) * 0.75;
    const mouse = mouseRef.current;
    const dx = x - mouse.x, dy = y - mouse.y;
    const distSq = dx * dx + dy * dy;
    if (distSq < mouseRadiusSq) {
      const dist = Math.sqrt(distSq);
      const influence = 1 - dist / params.mouseRadius;
      base -= influence * influence * params.mouseStrength;
    }
    const pulses = pulsesRef.current;
    for (let p = 0; p < pulses.length; p++) {
      const pulse = pulses[p];
      const pdx = x - pulse.x, pdy = y - pulse.y;
      const pdistSq = pdx * pdx + pdy * pdy;
      const waveRadius = pulse.time * 200;
      const waveWidth = 100;
      const outerBound = waveRadius + waveWidth;
      if (pdistSq > outerBound * outerBound) continue;
      const innerBound = waveRadius - waveWidth;
      if (innerBound > 0 && pdistSq < innerBound * innerBound) continue;
      const pdist = Math.sqrt(pdistSq);
      const distFromWave = Math.abs(pdist - waveRadius);
      if (distFromWave < waveWidth) {
        const waveInfluence = 1 - distFromWave / waveWidth;
        const decay = 1 - pulse.time / pulse.maxTime;
        base += 0.8 * waveInfluence * decay * Math.sin(waveInfluence * Math.PI);
      }
    }
    return base;
  };

  const drawContours = () => {
    const w = window.innerWidth, h = window.innerHeight;
    if (w === 0 || h === 0) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    const step = params.gridStep;
    const cols = Math.ceil(w / step) + 2, rows = Math.ceil(h / step) + 2;
    const grid = new Float32Array(rows * cols);
    for (let j = 0; j < rows; j++) {
      const offset = j * cols;
      const y = j * step;
      for (let i = 0; i < cols; i++) grid[offset + i] = field(i * step, y, atime);
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
        const rowOff = j * cols, nextRowOff = rowOff + cols;
        for (let i = 0; i < cols - 1; i++) {
          const a = grid[rowOff + i], b = grid[rowOff + i + 1];
          const c = grid[nextRowOff + i + 1], d = grid[nextRowOff + i];
          const ax = i * step, ay = j * step;
          let idx = 0;
          if (a > iso) idx |= 1;
          if (b > iso) idx |= 2;
          if (c > iso) idx |= 4;
          if (d > iso) idx |= 8;
          if (idx === 0 || idx === 15) continue;
          const xL = ax, yL = ay + step * lerp(a, d, iso);
          const xR = ax + step, yR = ay + step * lerp(b, c, iso);
          const xT = ax + step * lerp(a, b, iso), yT = ay;
          const xB = ax + step * lerp(d, c, iso), yB = ay + step;
          switch (idx) {
            case 1: case 14: ctx.moveTo(xL, yL); ctx.lineTo(xT, yT); break;
            case 2: case 13: ctx.moveTo(xT, yT); ctx.lineTo(xR, yR); break;
            case 3: case 12: ctx.moveTo(xL, yL); ctx.lineTo(xR, yR); break;
            case 4: case 11: ctx.moveTo(xR, yR); ctx.lineTo(xB, yB); break;
            case 5:
              ctx.moveTo(xT, yT); ctx.lineTo(xR, yR);
              ctx.moveTo(xL, yL); ctx.lineTo(xB, yB); break;
            case 6: case 9: ctx.moveTo(xT, yT); ctx.lineTo(xB, yB); break;
            case 7: case 8: ctx.moveTo(xL, yL); ctx.lineTo(xB, yB); break;
            case 10:
              ctx.moveTo(xT, yT); ctx.lineTo(xL, yL);
              ctx.moveTo(xR, yR); ctx.lineTo(xB, yB); break;
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
    const mouseFactor = 1 - Math.pow(0.85, 60 * dt);
    const mouse = mouseRef.current;
    mouse.x += (mouse.tx - mouse.x) * mouseFactor;
    mouse.y += (mouse.ty - mouse.y) * mouseFactor;
    for (let i = pulsesRef.current.length - 1; i >= 0; i--) {
      pulsesRef.current[i].time += dt;
      if (pulsesRef.current[i].time > pulsesRef.current[i].maxTime) pulsesRef.current.splice(i, 1);
    }
    drawContours();
    requestAnimationFrame(raf);
  };

  fit();
  last = performance.now();

  const handleMouseMove = (e) => { mouseRef.current.tx = e.clientX; mouseRef.current.ty = e.clientY; };
  const handleMouseLeave = () => { mouseRef.current.tx = -1000; mouseRef.current.ty = -1000; };
  const handleClick = (e) => { pulsesRef.current.push({ x: e.clientX, y: e.clientY, time: 0, maxTime: 3.5 }); };

  window.addEventListener('resize', fit);
  document.addEventListener('fullscreenchange', fit);
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseleave', handleMouseLeave);
  canvas.addEventListener('click', handleClick);

  if (reducedMotion) {
    drawContours();
  } else {
    requestAnimationFrame(raf);
  }

  return () => {
    runIdRef.current++;
    window.removeEventListener('resize', fit);
    document.removeEventListener('fullscreenchange', fit);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseleave', handleMouseLeave);
    canvas.removeEventListener('click', handleClick);
  };
}

const ContourBackground = () => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, tx: -1000, ty: -1000 });
  const pulsesRef = useRef([]);
  const runIdRef = useRef(0);
  const workerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const supportsOffscreen = typeof canvas.transferControlToOffscreen === 'function';

    // Fallback: main thread (no OffscreenCanvas support)
    if (!supportsOffscreen) {
      return runMainThreadAnimation(canvas, mouseRef, pulsesRef, runIdRef);
    }

    // Worker path — handle StrictMode by checking if worker already exists
    let worker = workerRef.current;
    let isNewWorker = false;

    if (!worker) {
      // First mount: transfer canvas and create worker
      const offscreen = canvas.transferControlToOffscreen();
      worker = new Worker(
        new URL('../workers/contourWorker.js', import.meta.url),
        { type: 'module' }
      );
      workerRef.current = worker;
      isNewWorker = true;

      const w = window.innerWidth, h = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      worker.postMessage(
        { type: 'init', canvas: offscreen, width: w, height: h, dpr, reducedMotion },
        [offscreen]
      );
    }

    // Set up tick loop and event forwarding (runs on every mount)
    let rafId = 0;
    let pendingMouse = null;
    let mouseChanged = false;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const tick = (now) => {
      const msg = { type: 'tick', now };
      if (mouseChanged) {
        msg.mouse = pendingMouse;
        mouseChanged = false;
      }
      worker.postMessage(msg);
      rafId = requestAnimationFrame(tick);
    };

    const handleResize = () => {
      worker.postMessage({
        type: 'resize',
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: window.devicePixelRatio || 1
      });
    };

    const handleMouseMove = (e) => {
      pendingMouse = { tx: e.clientX, ty: e.clientY };
      mouseChanged = true;
    };

    const handleMouseLeave = () => {
      worker.postMessage({ type: 'mouseleave' });
      pendingMouse = { tx: -1000, ty: -1000 };
      mouseChanged = false;
    };

    const handleClick = (e) => {
      worker.postMessage({ type: 'click', x: e.clientX, y: e.clientY });
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('fullscreenchange', handleResize);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('click', handleClick);

    if (!reducedMotion) {
      rafId = requestAnimationFrame(tick);
    } else if (isNewWorker) {
      // Single tick for static frame on first init only
      worker.postMessage({ type: 'tick', now: performance.now() });
    }

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('fullscreenchange', handleResize);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('click', handleClick);
      // Don't terminate worker — StrictMode will re-mount immediately
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
