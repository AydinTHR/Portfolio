// src/utils/SimplexNoise.js
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
    const i = Math.floor(xin + s),
      j = Math.floor(yin + s);
    const t = (i + j) * G2;
    let X0 = i - t,
      Y0 = j - t;
    let x0 = xin - X0,
      y0 = yin - Y0;
    let i1, j1;

    if (x0 > y0) {
      i1 = 1;
      j1 = 0;
    } else {
      i1 = 0;
      j1 = 1;
    }

    const x1 = x0 - i1 + G2,
      y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2,
      y2 = y0 - 1 + 2 * G2;

    const ii = i & 255,
      jj = j & 255;
    const gi0 = (this.perm[ii + this.perm[jj]] % 12) * 2;
    const gi1 = (this.perm[ii + i1 + this.perm[jj + j1]] % 12) * 2;
    const gi2 = (this.perm[ii + 1 + this.perm[jj + 1]] % 12) * 2;

    let n0 = 0,
      n1 = 0,
      n2 = 0;

    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 > 0) {
      t0 *= t0;
      n0 = t0 * t0 * (this.grad3[gi0] * x0 + this.grad3[gi0 + 1] * y0);
    }

    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 > 0) {
      t1 *= t1;
      n1 = t1 * t1 * (this.grad3[gi1] * x1 + this.grad3[gi1 + 1] * y1);
    }

    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 > 0) {
      t2 *= t2;
      n2 = t2 * t2 * (this.grad3[gi2] * x2 + this.grad3[gi2 + 1] * y2);
    }

    return 70 * (n0 + n1 + n2);
  }
}

export default SimplexNoise;