// Self-contained contour animation worker
// Inlined SimplexNoise to avoid cross-bundle issues

class SimplexNoise {
  constructor(seed = 1337) {
    this.p = new Uint8Array(256);
    let n = seed >>> 0;
    const rand = () =>
      ((n ^= n << 13, n ^= n >>> 17, n ^= n << 5, n >>> 0)) / 4294967295;

    for (let i = 0; i < 256; i++) this.p[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [this.p[i], this.p[j]] = [this.p[j], this.p[i]];
    }

    this.perm = new Uint8Array(512);
    this.grad3 = new Float32Array([
      1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0,
      1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1,
      0, 1, 0, -1, 0, 1, 0, -1,
    ]);

    for (let i = 0; i < 512; i++) this.perm[i] = this.p[i & 255];

    const sqrt3 = Math.sqrt(3);
    this._F2 = 0.5 * (sqrt3 - 1);
    this._G2 = (3 - sqrt3) / 6;
  }

  noise2D(xin, yin) {
    const F2 = this._F2, G2 = this._G2;
    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s), j = Math.floor(yin + s);
    const t = (i + j) * G2;
    const x0 = xin - (i - t), y0 = yin - (j - t);
    const i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
    const ii = i & 255, jj = j & 255;
    const gi0 = (this.perm[ii + this.perm[jj]] % 12) * 2;
    const gi1 = (this.perm[ii + i1 + this.perm[jj + j1]] % 12) * 2;
    const gi2 = (this.perm[ii + 1 + this.perm[jj + 1]] % 12) * 2;
    let n0 = 0, n1 = 0, n2 = 0;
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 > 0) { t0 *= t0; n0 = t0 * t0 * (this.grad3[gi0] * x0 + this.grad3[gi0 + 1] * y0); }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 > 0) { t1 *= t1; n1 = t1 * t1 * (this.grad3[gi1] * x1 + this.grad3[gi1 + 1] * y1); }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 > 0) { t2 *= t2; n2 = t2 * t2 * (this.grad3[gi2] * x2 + this.grad3[gi2 + 1] * y2); }
    return 70 * (n0 + n1 + n2);
  }
}

// --- Animation state ---
let ctx, width, height, dpr;
let noise, time = 0, atime = 0, last = 0;
let mouseX = -1000, mouseY = -1000, mouseTX = -1000, mouseTY = -1000;
let pulses = [];
let gridBuf = null;
let running = false;

const params = {
  lineWidth: 1.2, levels: 7, scale: 400, speed: 0.8,
  smooth: 1, gridStep: 4, mouseRadius: 120, mouseStrength: 1.8
};
const invScale = 1 / params.scale;
const invScaleSmall = 1 / (params.scale * 0.45);
const invScaleSmallY = 1 / (params.scale * 0.5);
const mouseRadiusSq = params.mouseRadius * params.mouseRadius;

const lerp = (v1, v2, iso) => (iso - v1) / (v2 - v1 + 1e-6);

function field(x, y, t) {
  const n1 = noise.noise2D(x * invScale + t * 0.07, y * invScale + t * 0.05);
  const n2 = 0.5 * noise.noise2D(x * invScaleSmall - t * 0.03, y * invScaleSmallY + 100 + t * 0.02);
  let base = (n1 + n2) * 0.75;

  const dx = x - mouseX, dy = y - mouseY;
  const distSq = dx * dx + dy * dy;
  if (distSq < mouseRadiusSq) {
    const dist = Math.sqrt(distSq);
    const influence = 1 - dist / params.mouseRadius;
    base -= influence * influence * params.mouseStrength;
  }

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
}

function drawContours() {
  if (width === 0 || height === 0) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  const step = params.gridStep;
  const cols = Math.ceil(width / step) + 2;
  const rows = Math.ceil(height / step) + 2;
  const needed = rows * cols;

  if (!gridBuf || gridBuf.length < needed) {
    gridBuf = new Float32Array(needed);
  }

  for (let j = 0; j < rows; j++) {
    const offset = j * cols;
    const y = j * step;
    for (let i = 0; i < cols; i++) {
      gridBuf[offset + i] = field(i * step, y, atime);
    }
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
      const rowOff = j * cols;
      const nextRowOff = rowOff + cols;
      for (let i = 0; i < cols - 1; i++) {
        const a = gridBuf[rowOff + i];
        const b = gridBuf[rowOff + i + 1];
        const c = gridBuf[nextRowOff + i + 1];
        const d = gridBuf[nextRowOff + i];
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
          case 1: case 14:
            ctx.moveTo(xL, yL); ctx.lineTo(xT, yT); break;
          case 2: case 13:
            ctx.moveTo(xT, yT); ctx.lineTo(xR, yR); break;
          case 3: case 12:
            ctx.moveTo(xL, yL); ctx.lineTo(xR, yR); break;
          case 4: case 11:
            ctx.moveTo(xR, yR); ctx.lineTo(xB, yB); break;
          case 5:
            ctx.moveTo(xT, yT); ctx.lineTo(xR, yR);
            ctx.moveTo(xL, yL); ctx.lineTo(xB, yB); break;
          case 6: case 9:
            ctx.moveTo(xT, yT); ctx.lineTo(xB, yB); break;
          case 7: case 8:
            ctx.moveTo(xL, yL); ctx.lineTo(xB, yB); break;
          case 10:
            ctx.moveTo(xT, yT); ctx.lineTo(xL, yL);
            ctx.moveTo(xR, yR); ctx.lineTo(xB, yB); break;
        }
      }
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function processTick(now) {
  if (!running) return;
  if (!Number.isFinite(now)) now = performance.now();
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  time += dt * params.speed;
  const smoothFactor = params.smooth >= 1 ? 1 : (1 - Math.pow(1 - params.smooth, 60 * dt));
  atime += (time - atime) * smoothFactor;

  const mouseFactor = 1 - Math.pow(0.85, 60 * dt);
  mouseX += (mouseTX - mouseX) * mouseFactor;
  mouseY += (mouseTY - mouseY) * mouseFactor;

  for (let i = pulses.length - 1; i >= 0; i--) {
    pulses[i].time += dt;
    if (pulses[i].time > pulses[i].maxTime) pulses.splice(i, 1);
  }

  drawContours();
}

// --- Message handler ---
self.onmessage = (e) => {
  const msg = e.data;
  switch (msg.type) {
    case 'init': {
      const offscreen = msg.canvas;
      ctx = offscreen.getContext('2d');
      width = msg.width;
      height = msg.height;
      dpr = msg.dpr;
      offscreen.width = width * dpr;
      offscreen.height = height * dpr;
      noise = new SimplexNoise(20251003);
      time = 0; atime = 0; last = 0;
      mouseX = -1000; mouseY = -1000;
      mouseTX = -1000; mouseTY = -1000;
      pulses = [];
      running = true;

      if (msg.reducedMotion) {
        last = performance.now();
        drawContours();
        running = false;
      }
      self.postMessage({ type: 'ready' });
      break;
    }
    case 'resize':
      width = msg.width;
      height = msg.height;
      dpr = msg.dpr;
      ctx.canvas.width = width * dpr;
      ctx.canvas.height = height * dpr;
      break;
    case 'tick':
      if (msg.mouse) {
        mouseTX = msg.mouse.tx;
        mouseTY = msg.mouse.ty;
      }
      processTick(msg.now);
      break;
    case 'mouseleave':
      mouseTX = -1000;
      mouseTY = -1000;
      break;
    case 'click':
      pulses.push({ x: msg.x, y: msg.y, time: 0, maxTime: 3.5 });
      break;
    case 'stop':
      running = false;
      break;
  }
};
