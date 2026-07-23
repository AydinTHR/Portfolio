// src/components/ExpeditionMap.jsx
// The Projects section as one interactive terrain: a full-bleed contour field
// where every project is a basecamp waypoint on a dotted amber route. The route
// draws itself as the section scrolls in; hovering a waypoint raises the terrain
// beneath it; clicking opens the case study. Same marching-squares-over-simplex
// technique as ContourBackground, but reacting to waypoint hover rather than to
// the cursor, and drifting far slower.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SimplexNoise from '../utils/SimplexNoise';

// Deterministic rng, so a given project count always lays out identically.
const seededRng = (a) => () => {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const INV_S = 1 / 400;
const INV_SX = 1 / (400 * 0.45);
const INV_SY = 1 / (400 * 0.5);

// A hovered marker's label is centred on its dot and caps at 240px plus padding
// and border, so half of the widest possible label is 130px. Clearing that keeps
// the mono label off the panel's body copy.
const PANEL_WIDTH = 340;
const PANEL_GAP = 144;

// Survey coordinates are decorative and generated from the title, never stored.
// The project schema has no coords field and should not grow one: nobody should
// have to type made-up latitudes into the admin panel.
const coordsFor = (title, index) => {
  const key = `${title}#${index}`;
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const lat = 43 + ((h >>> 8) % 1000) / 1000;
  const lon = 79 + ((h >>> 18) % 1000) / 1000;
  return `${lat.toFixed(2)}°N ${lon.toFixed(2)}°W`;
};

const ExpeditionMap = ({ projects, slugs }) => {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const hoverRef = useRef(-1);
  const apiRef = useRef(null);
  const [active, setActive] = useState(-1);

  const count = projects.length;

  // Basecamp layout is derived from the project count, never stored, so the map
  // reshapes itself as projects are added or removed from the admin panel.
  // Keyed on the count rather than the array: useContent hands back a freshly
  // merged array on every content event, which would otherwise rebuild the
  // canvas from scratch each time.
  const waypoints = useMemo(() => {
    if (count < 2) return [{ x: 0.5, y: 0.5 }];
    const rnd = seededRng(count * 7919);
    return Array.from({ length: count }, (_, i) => ({
      x: 0.12 + (0.76 * i) / (count - 1),
      y: (i % 2 === 0 ? 0.62 : 0.34) + (rnd() - 0.5) * 0.1,
    }));
  }, [count]);

  const setHover = (i) => {
    hoverRef.current = i;
    setActive(i);
    if (apiRef.current) apiRef.current.poke();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return undefined;
    const ctx = canvas.getContext('2d');
    const noise = new SimplexNoise(20260704);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let W = 0;
    let H = 0;
    let dpr = 1;
    let route = [];
    const amps = waypoints.map(() => 0.85);
    let time = 0;
    let routeP = reduce ? 1 : 0;
    let last = performance.now();
    let rafId = 0;

    // ContourBackground's field(), with a Gaussian bump added at each basecamp
    // in place of the hero's cursor repulsion and click pulses.
    const field = (x, y, t) => {
      let v =
        0.75 *
        (noise.noise2D(x * INV_S + t * 0.07, y * INV_S + t * 0.05) +
          0.5 * noise.noise2D(x * INV_SX - t * 0.03, y * INV_SY + 100 + t * 0.02));
      const sig = Math.min(W, H) * Math.min(0.16, 0.06 + 0.3 / waypoints.length);
      for (let i = 0; i < waypoints.length; i++) {
        const dx = x - waypoints[i].x * W;
        const dy = y - waypoints[i].y * H;
        v += amps[i] * Math.exp(-(dx * dx + dy * dy) / (2 * sig * sig));
      }
      return v;
    };

    // Catmull-Rom through the waypoints, so the route reads as a trail rather
    // than a connect-the-dots diagram.
    const buildRoute = () => {
      const pts = waypoints.map((w) => [w.x * W, w.y * H]);
      const ext = [pts[0]].concat(pts, [pts[pts.length - 1]]);
      const out = [];
      for (let i = 1; i < ext.length - 2; i++) {
        const p0 = ext[i - 1];
        const p1 = ext[i];
        const p2 = ext[i + 1];
        const p3 = ext[i + 2];
        for (let t = 0; t < 28; t++) {
          const u = t / 28;
          const u2 = u * u;
          const u3 = u2 * u;
          out.push([
            0.5 *
              (2 * p1[0] +
                (-p0[0] + p2[0]) * u +
                (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 +
                (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3),
            0.5 *
              (2 * p1[1] +
                (-p0[1] + p2[1]) * u +
                (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 +
                (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3),
          ]);
        }
      }
      out.push(pts[pts.length - 1]);
      return out;
    };

    const lerp = (a, b, iso) => (iso - a) / (b - a + 1e-9);

    const draw = () => {
      if (!W || !H) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      // Light mode paints its own ink and deeper amber. It must not reuse the
      // hero canvas's invert filter, which would turn the amber blue.
      const light = document.documentElement.getAttribute('data-theme') === 'light';
      const baseInk = light ? '#1c160e' : '#ffffff';
      const accentInk = light ? '#DF920F' : '#F5A623';

      ctx.strokeStyle = baseInk;
      ctx.globalAlpha = light ? 0.12 : 0.08;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let gx = 130; gx < W - 50; gx += 170) {
        for (let gy = 90; gy < H - 50; gy += 150) {
          ctx.moveTo(gx - 5, gy);
          ctx.lineTo(gx + 5, gy);
          ctx.moveTo(gx, gy - 5);
          ctx.lineTo(gx, gy + 5);
        }
      }
      ctx.stroke();

      const STEP = 4;
      const cols = Math.ceil(W / STEP) + 2;
      const rows = Math.ceil(H / STEP) + 2;
      const grid = new Float32Array(rows * cols);
      for (let j = 0; j < rows; j++) {
        const off = j * cols;
        const y = j * STEP;
        for (let i = 0; i < cols; i++) grid[off + i] = field(i * STEP, y, time);
      }

      const LEVELS = 9;
      const ACCENT = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let L = 0; L < LEVELS; L++) {
        const iso = -0.9 + (2.5 * L) / (LEVELS - 1);
        const acc = L === ACCENT;
        ctx.strokeStyle = acc ? accentInk : baseInk;
        ctx.lineWidth = acc ? 1.7 : 1.2;
        ctx.globalAlpha = acc ? (light ? 0.55 : 0.6) : light ? 0.3 : 0.32;
        ctx.beginPath();
        for (let j = 0; j < rows - 1; j++) {
          const ro = j * cols;
          const no = ro + cols;
          for (let i = 0; i < cols - 1; i++) {
            const a = grid[ro + i];
            const b = grid[ro + i + 1];
            const c = grid[no + i + 1];
            const d = grid[no + i];
            let idx = 0;
            if (a > iso) idx |= 1;
            if (b > iso) idx |= 2;
            if (c > iso) idx |= 4;
            if (d > iso) idx |= 8;
            if (idx === 0 || idx === 15) continue;
            const ax = i * STEP;
            const ay = j * STEP;
            const xL = ax;
            const yL = ay + STEP * lerp(a, d, iso);
            const xR = ax + STEP;
            const yR = ay + STEP * lerp(b, c, iso);
            const xT = ax + STEP * lerp(a, b, iso);
            const yT = ay;
            const xB = ax + STEP * lerp(d, c, iso);
            const yB = ay + STEP;
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

      if (route.length > 1) {
        const n = Math.max(2, Math.floor(route.length * routeP));
        ctx.beginPath();
        ctx.moveTo(route[0][0], route[0][1]);
        for (let i = 1; i < n; i++) ctx.lineTo(route[i][0], route[i][1]);
        ctx.strokeStyle = accentInk;
        ctx.globalAlpha = 0.9;
        ctx.lineWidth = 2;
        ctx.setLineDash([2, 9]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.globalAlpha = 1;
    };

    const step = (now) => {
      if (!Number.isFinite(now)) now = performance.now();
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      // The hero's drift coefficients at a deliberately slower speed: this is a
      // calm backdrop to hover over, not an ambient hero.
      time += dt * 0.1;
      for (let i = 0; i < amps.length; i++) {
        const target = hoverRef.current === i ? 1.75 : 0.85;
        amps[i] += (target - amps[i]) * Math.min(1, dt * 5);
      }
      const r = wrap.getBoundingClientRect();
      const target = Math.min(1, Math.max(0, (window.innerHeight * 0.9 - r.top) / (r.height * 0.9)));
      routeP += (target - routeP) * Math.min(1, dt * 4);
      draw();
      rafId = requestAnimationFrame(step);
    };

    const fit = () => {
      dpr = window.devicePixelRatio || 1;
      W = wrap.clientWidth;
      H = wrap.clientHeight;
      if (!W || !H) return;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      route = buildRoute();
      draw();
    };

    fit();
    window.addEventListener('resize', fit);

    // Never animate an offscreen canvas.
    let io = null;
    if (typeof IntersectionObserver !== 'undefined' && !reduce) {
      io = new IntersectionObserver(
        (entries) => {
          const visible = entries[0].isIntersecting;
          if (visible && !rafId) {
            last = performance.now();
            rafId = requestAnimationFrame(step);
          }
          if (!visible && rafId) {
            cancelAnimationFrame(rafId);
            rafId = 0;
          }
        },
        { threshold: 0.02 }
      );
      io.observe(wrap);
    }

    // Repaint on a theme flip, which matters most under reduced motion where
    // there is no loop to pick the new palette up.
    const themeObserver = new MutationObserver(() => draw());
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    // Under reduced motion hover still raises the terrain, as one instant
    // redraw rather than a tween.
    apiRef.current = {
      poke: () => {
        if (!reduce) return;
        for (let i = 0; i < amps.length; i++) {
          amps[i] = hoverRef.current === i ? 1.75 : 0.85;
        }
        draw();
      },
    };

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', fit);
      if (io) io.disconnect();
      themeObserver.disconnect();
      apiRef.current = null;
    };
  }, [waypoints]);

  const activeProject = active >= 0 ? projects[active] : null;
  const activeWaypoint = active >= 0 ? waypoints[active] : null;

  const years = projects.map((p) => parseInt(p.year, 10)).filter((y) => !Number.isNaN(y));
  const lo = years.length ? Math.min(...years) : 0;
  const hi = years.length ? Math.max(...years) : 0;
  const yearSpan = years.length ? (lo === hi ? String(lo) : `${lo}–${hi}`) : '';

  // Keep the panel on whichever side of the marker has room for it. The offset
  // clears the marker's own label, which expands to its full width on hover:
  // the handoff's 48px let a long title run underneath the panel's body copy.
  const panelStyle = activeWaypoint
    ? {
        left:
          activeWaypoint.x < 0.5
            ? `calc(${activeWaypoint.x * 100}% + ${PANEL_GAP}px)`
            : `calc(${activeWaypoint.x * 100}% - ${PANEL_GAP + PANEL_WIDTH}px)`,
        top: `max(20px, calc(${activeWaypoint.y * 100}% - 150px))`,
      }
    : null;

  return (
    <div
      className={`pk-map-wrap${count > 4 ? ' pk-map-wrap--dense' : ''}`}
      ref={wrapRef}
      onMouseLeave={() => setHover(-1)}
    >
      <canvas ref={canvasRef} className="pk-map-canvas" aria-hidden="true" />

      <div className="pk-map-legend">
        EXPEDITION LOG · <b>{String(count).padStart(2, '0')} BASECAMPS</b>
        {yearSpan ? ` · ${yearSpan}` : ''}
      </div>
      <div className="pk-map-north" aria-hidden="true">
        N
        <br />↑
      </div>
      <div className="pk-map-scale" aria-hidden="true">
        1 : 24 000
        <i />
      </div>

      {projects.map((project, i) => (
        <Link
          key={i}
          className={`pk-marker${active === i ? ' pk-marker--on' : ''}`}
          to={`/projects/${slugs[i]}`}
          style={{ left: `${waypoints[i].x * 100}%`, top: `${waypoints[i].y * 100}%` }}
          onMouseEnter={() => setHover(i)}
          onFocus={() => setHover(i)}
          onBlur={() => setHover(-1)}
          aria-label={`Basecamp ${project.number}: ${project.title}`}
        >
          <span className="pk-marker__dot" />
          <span className="pk-marker__tag">
            BC {project.number} · {project.title}
          </span>
          <span className="pk-marker__coords">{coordsFor(project.title, i)}</span>
        </Link>
      ))}

      {activeProject && (
        <div
          className="pk-map-panel"
          style={panelStyle}
          key={active}
          onMouseEnter={() => setHover(active)}
        >
          <p className="pk-map-panel__eyebrow">
            {activeProject.category}
            {activeProject.category && activeProject.year ? ' · ' : ''}
            {activeProject.year}
          </p>
          <h3 className="pk-map-panel__title">{activeProject.title}</h3>
          <p className="pk-map-panel__desc">{activeProject.description}</p>
          <div className="pk-map-panel__chips">
            {(activeProject.technologies || []).slice(0, 4).map((tech) => (
              <span className="pk-map-panel__chip" key={tech}>
                {tech}
              </span>
            ))}
          </div>
          <Link className="pk-map-panel__link" to={`/projects/${slugs[active]}`}>
            OPEN CASE STUDY →
          </Link>
        </div>
      )}
    </div>
  );
};

export default ExpeditionMap;
