/* Конверт с печатью и пролёт камеры через деревья к арке.
   Весь пейзаж рисуется кодом на canvas (без чужих картинок), по слоям разной глубины. */
(() => {
'use strict';
const D = window.WEDDING;
const qs = new URLSearchParams(location.search);
const TAU = Math.PI * 2;
const $ = id => document.getElementById(id);
const root = document.documentElement;
const THEME = root.dataset.theme || '';   // 'burgundy' — второй вариант (2/index.html)

/* ---------- случайность: одинаковый рисунок при каждом открытии ---------- */
let S = 1;
function seedFrom(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } S = h >>> 0; }
function R() { S |= 0; S = S + 0x6D2B79F5 | 0; let t = Math.imul(S ^ S >>> 15, 1 | S); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
const rnd = (a, b) => a + (b - a) * R();
const pick = a => a[(R() * a.length) | 0];
const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
const seg = (t, ab) => clamp((t - ab[0]) / (ab[1] - ab[0]));
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeIn = t => t * t * t;

/* ---------- цвет ---------- */
const hx = c => { const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
function mixc(a, b, t) { const A = hx(a), B = hx(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); }
const HAZE = '#e4e2d0';
const hazed = (P, k, to = HAZE) => { const o = {}; for (const n in P) o[n] = P[n].map(c => mixc(c, to, k)); return o; };
const TREE = { d: ['#25301e', '#2b3722', '#212a1a'], m: ['#435330', '#4b5c35', '#3e4d2d'], l: ['#6b7f43', '#768a4a', '#647841'], h: ['#a2b465', '#b1c176', '#bfca88'] };
const SAGE = { d: ['#36402c', '#3a442f'], m: ['#5a6946', '#62704c'], l: ['#86956a', '#909e72'], h: ['#b8c396', '#c6cea5'] };
const DARK = { d: ['#141b10', '#182013'], m: ['#232f1b', '#28351e'], l: ['#384a27', '#3f522c'], h: ['#566a35', '#5f743b'] };
const ROSE = {
  blush: ['#f2c5c0', '#d6918f', '#fde8e3'], dusty: ['#d48e98', '#a65967', '#efb7be'], deep: ['#a64e5f', '#773041', '#c86f7e'],
  cream: ['#f8eedb', '#dbc6a2', '#fffaf0'], white: ['#fffdf8', '#ddd3c5', '#ffffff'], peach: ['#f4c0a2', '#d68f6d', '#fde0cd']
};

/* ---------- кисти ---------- */
// пачка листочков одного цвета одной заливкой: [x, y, размер, поворот, сплющенность, ...]
function dabs(ctx, color, a) {
  if (!a.length) return;
  ctx.fillStyle = color; ctx.beginPath();
  for (let i = 0; i < a.length; i += 5) {
    const x = a[i], y = a[i + 1], s = a[i + 2], r = a[i + 3];
    ctx.moveTo(x + Math.cos(r) * s, y + Math.sin(r) * s);
    ctx.ellipse(x, y, s, s * a[i + 4], r, 0, TAU);
  }
  ctx.fill();
}
// шапка листвы: тёмная основа, затем средние, светлые и блики — свет сверху
function clump(ctx, cx, cy, rx, ry, P, o = {}) {
  const leaf = o.leaf || 4, lx = o.lx ?? .35, ly = o.ly ?? .92, flat = o.flat || .6;
  const n = Math.max(24, Math.round(Math.PI * rx * ry / (leaf * leaf) * .5 * (o.dens || 1)));
  if (o.core !== false) { ctx.fillStyle = P.d[0]; ctx.beginPath(); ctx.ellipse(cx, cy + ry * .04, rx * .84, ry * .8, 0, 0, TAU); ctx.fill(); }
  const passes = [[P.d, -9, .95, 1.3, 1.07], [P.m, -.2, .85, 1.05, 1], [P.l, .28, .6, .95, .97], [P.h, .68, .3, .72, .94]];
  for (const [cols, th, k, sz, edge] of passes) {
    const bk = cols.map(() => []);
    const cnt = Math.round(n * k);
    for (let i = 0; i < cnt; i++) {
      const a = R() * TAU, r = Math.sqrt(R()) * edge;
      const u = Math.cos(a) * r, v = Math.sin(a) * r;
      const L = -(u * lx + v * ly) + (1 - r * r) * .22 + (R() - .5) * .55;
      if (L < th) continue;
      bk[(R() * cols.length) | 0].push(cx + u * rx, cy + v * ry, leaf * sz * rnd(.7, 1.3), rnd(-1, 1) + (o.rot || 0), flat);
    }
    bk.forEach((b, i) => dabs(ctx, cols[i], b));
  }
}
// изогнутая сужающаяся ветка
function limb(ctx, x1, y1, x2, y2, w1, w2, col, hi) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const mx = (x1 + x2) / 2 + rnd(-.14, .14) * len, my = (y1 + y2) / 2 + rnd(-.1, .1) * len;
  const N = Math.max(3, Math.min(10, Math.round(len / 12)));
  const pts = []; let px = x1, py = y1;
  for (let i = 1; i <= N; i++) {
    const t = i / N, it = 1 - t;
    const qx = it * it * x1 + 2 * it * t * mx + t * t * x2, qy = it * it * y1 + 2 * it * t * my + t * t * y2;
    pts.push([px, py, qx, qy, w1 + (w2 - w1) * t]); px = qx; py = qy;
  }
  ctx.lineCap = 'round'; ctx.strokeStyle = col;
  for (const p of pts) { ctx.lineWidth = p[4]; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[2], p[3]); ctx.stroke(); }
  if (hi && w1 > 2.5) {
    ctx.strokeStyle = hi;
    for (const p of pts) { const off = -p[4] * .22; ctx.lineWidth = p[4] * .28; ctx.beginPath(); ctx.moveTo(p[0] + off, p[1]); ctx.lineTo(p[2] + off, p[3]); ctx.stroke(); }
  }
}
// дерево: ствол ветвится, на концах ветвей — шапки листвы (как у пиний и олив)
function tree(ctx, x, y, o) {
  const ends = [];
  const go = (x, y, ang, len, w, d) => {
    const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
    limb(ctx, x, y, x2, y2, w, w * .72, o.bark || '#3b342b', o.barkHi || '#6e604f');
    if (d === 0) { ends.push([x2, y2]); return; }
    const k = R() < (o.fork ?? .35) ? 3 : 2;
    for (let i = 0; i < k; i++) {
      let a = ang + (i - (k - 1) / 2) * o.spread * rnd(.7, 1.3) + rnd(-.18, .18);
      a = clamp(a, o.aMin ?? -Math.PI + .25, o.aMax ?? -.25);
      go(x2, y2, a, len * rnd(.62, .8), w * .68, d - 1);
    }
  };
  go(x, y, -Math.PI / 2 + (o.lean || 0), o.h, o.w, o.depth ?? 3);
  ends.sort((a, b) => a[1] - b[1]);
  for (const [ex, ey] of ends) {
    const r = o.cr * rnd(.75, 1.2);
    clump(ctx, ex + rnd(-.2, .2) * r, ey - r * .12, r, r * rnd(.5, .66), o.P, o);
  }
}
function cypress(ctx, x, yb, h, w, P, o = {}) {
  clump(ctx, x, yb - h * .45, w / 2, h * .45, P, { ...o, lx: .8, ly: .45, flat: .5 });
  clump(ctx, x, yb - h * .84, w * .28, h * .18, P, { ...o, lx: .8, ly: .45, flat: .5 });
}
// заострённый лист
function leafP(ctx, x, y, l, w, a, c1, c2) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(a);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(l * .5, -w, l, 0); ctx.quadraticCurveTo(l * .5, w, 0, 0); ctx.fillStyle = c1; ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(l * .5, w, l, 0); ctx.closePath(); ctx.fillStyle = c2; ctx.globalAlpha = .55; ctx.fill(); ctx.globalAlpha = 1;
  ctx.restore();
}
function rose(ctx, x, y, r, c) {
  const [b, d, l] = c;
  ctx.fillStyle = d; ctx.beginPath(); ctx.arc(x, y + r * .1, r * 1.04, 0, TAU); ctx.fill();
  ctx.fillStyle = b;
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + rnd(-.25, .25); ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * r * .4, y + Math.sin(a) * r * .36, r * .6, r * .46, a, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = d; ctx.lineCap = 'round';
  for (let k = 0; k < 4; k++) { const rr = r * (.66 - k * .15), s = rnd(0, TAU); ctx.lineWidth = Math.max(.5, r * .075); ctx.beginPath(); ctx.arc(x + rnd(-.06, .06) * r, y + rnd(-.06, .06) * r, rr, s, s + rnd(2.2, 3.8)); ctx.stroke(); }
  ctx.fillStyle = l; ctx.globalAlpha = .75; ctx.beginPath(); ctx.ellipse(x - r * .28, y - r * .36, r * .34, r * .16, -.45, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
}
function blossom(ctx, x, y, r, col, mid) {
  ctx.fillStyle = col; ctx.beginPath(); const a0 = R() * TAU;
  for (let i = 0; i < 5; i++) {
    const a = a0 + i / 5 * TAU, px = x + Math.cos(a) * r * .55, py = y + Math.sin(a) * r * .55;
    ctx.moveTo(px + Math.cos(a) * r * .5, py + Math.sin(a) * r * .5); ctx.ellipse(px, py, r * .5, r * .36, a, 0, TAU);
  }
  ctx.fill(); ctx.fillStyle = mid; ctx.beginPath(); ctx.arc(x, y, r * .2, 0, TAU); ctx.fill();
}
function spike(ctx, x, yb, h, c) {
  const tx = x + rnd(-.08, .08) * h;
  ctx.strokeStyle = '#5a6845'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, yb); ctx.quadraticCurveTo(x, yb - h * .5, tx, yb - h); ctx.stroke();
  const n = Math.max(5, Math.round(h / 5));
  for (let i = n - 1; i >= 0; i--) {
    const t = i / n, px = x + (tx - x) * t * t, py = yb - h * t, s = ((1 - t * .65) * h * .04 + 1.3) * (U > 1 ? 1 : U);
    ctx.fillStyle = i % 3 ? c[0] : c[1]; ctx.beginPath(); ctx.ellipse(px + (i % 2 ? s * .6 : -s * .6), py, s, s * .8, 0, 0, TAU); ctx.fill();
  }
}
// свисающая плеть с листочками
function strand(ctx, x, y, len, P, leaf) {
  const sw = rnd(-.1, .1) * len, cx = x + sw * .2, cy = y + len * .5, ex = x + sw, ey = y + len;
  ctx.strokeStyle = P.d[0]; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(cx, cy, ex, ey); ctx.stroke();
  const n = Math.max(4, Math.round(len / (leaf * 1.45)));
  const pts = { d: [], m: [], l: [], h: [] };
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), it = 1 - t;
    const px = it * it * x + 2 * it * t * cx + t * t * ex, py = it * it * y + 2 * it * t * cy + t * t * ey;
    const s = leaf * (1 - .45 * t) * rnd(.8, 1.2), side = i % 2 ? 1 : -1, ang = Math.PI / 2 + side * rnd(.35, .8);
    const tone = t < .22 ? 'd' : R() < .45 ? 'm' : R() < .7 ? 'l' : 'h';
    pts[tone].push(px + Math.cos(ang) * s * .8, py + Math.sin(ang) * s * .8, s, ang, .34);
  }
  for (const k in pts) dabs(ctx, pick(P[k]), pts[k]);
}
// дыра в листве с рваным лиственным краем — сквозь неё пролетает камера
function hole(ctx, cx, cy, r, leaf) {
  ctx.save(); ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
  const a = [];
  for (let i = 0; i < 320; i++) { const ang = R() * TAU, rr = r * (1 + Math.pow(R(), 2) * .38); a.push(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr, leaf * rnd(.8, 1.6), rnd(-1, 1), .6); }
  dabs(ctx, '#000', a);
  ctx.restore();
}
function ridgeY(x, yb, amp, f, ph) { return yb - amp * (.55 * Math.sin(x * f + ph) + .28 * Math.sin(x * f * 2.7 + ph * 1.9) + .17 * Math.sin(x * f * 6.3 + ph * .7)); }
function ridge(ctx, x0, x1, yb, amp, f, ph, top, bot, ybot) {
  const p = new Path2D(); p.moveTo(x0, ybot);
  for (let x = x0; x <= x1 + 3; x += 3) p.lineTo(x, ridgeY(x, yb, amp, f, ph));
  p.lineTo(x1, ybot); p.closePath();
  const g = ctx.createLinearGradient(0, yb - amp, 0, Math.min(ybot, yb + amp * 6)); g.addColorStop(0, top); g.addColorStop(1, bot);
  ctx.fillStyle = g; ctx.fill(p); return p;
}
function hatch(ctx, path, col, alpha, slope, step) {
  ctx.save(); ctx.clip(path); ctx.strokeStyle = col; ctx.globalAlpha = alpha; ctx.lineWidth = 1; ctx.beginPath();
  for (let x = -W; x < 2 * W; x += step + R() * step) { ctx.moveTo(x, .3 * H); ctx.lineTo(x + .4 * H * slope, .72 * H); }
  ctx.stroke(); ctx.restore();
}

/* ---------- слои сцены ---------- */
const hero = $('hero'), scene = $('scene'), vig = $('vig');
let W = 390, H = 844, VP = { x: 195, y: 520 }, U = 1;
const PR = Math.min(window.devicePixelRatio || 1, 1.5);
const CAM = [];          // слои, которые двигает камера
const FX = {};           // ветви и цветы
const FILTER_OK = (() => { try { const c = document.createElement('canvas').getContext('2d'); c.filter = 'blur(2px)'; return c.filter === 'blur(2px)'; } catch (e) { return false; } })();

// слой глубины: рисуется в координатах экрана, увеличивается вокруг точки схода VP
function camLayer(k, z, mode, m = 1, withCanvas = true) {
  const left = VP.x * (1 - m), top = VP.y * (1 - m), w = W * m, h = H * m;
  const wrap = document.createElement('div'); wrap.className = 'ly ly-' + k;
  wrap.style.cssText = `left:${left}px;top:${top}px;width:${w}px;height:${h}px;transform-origin:${VP.x - left}px ${VP.y - top}px`;
  let cv = null, ctx = null;
  if (withCanvas) {
    cv = document.createElement('canvas'); cv.width = Math.round(w * PR); cv.height = Math.round(h * PR);
    ctx = cv.getContext('2d'); ctx.setTransform(PR, 0, 0, PR, -left * PR, -top * PR);
    wrap.appendChild(cv);
  }
  scene.insertBefore(wrap, vig);
  const L = { k, z, mode, wrap, cv, ctx }; CAM.push(L); return L;
}
function rectLayer(k, x, y, w, h, cls = '') {
  const wrap = document.createElement('div'); wrap.className = 'ly ly-' + k + ' ' + cls;
  wrap.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
  const inner = document.createElement('div'); inner.className = 'sway';
  const cv = document.createElement('canvas'); cv.width = Math.round(w * PR); cv.height = Math.round(h * PR);
  const ctx = cv.getContext('2d'); ctx.setTransform(PR, 0, 0, PR, -x * PR, -y * PR);
  inner.appendChild(cv); wrap.appendChild(inner); scene.appendChild(wrap);
  return (FX[k] = { k, wrap, inner, cv, ctx });
}
// размытая копия слоя — для веток, пролетающих у самой камеры
function soften(L, px) {
  const src = L.cv, w = src.width, h = src.height;
  const out = document.createElement('canvas'); out.width = w; out.height = h;
  const oc = out.getContext('2d');
  if (FILTER_OK) { oc.filter = `blur(${px * PR}px)`; oc.drawImage(src, 0, 0); }
  else {
    const f = Math.max(2, Math.round(px * PR / 1.6)), t = document.createElement('canvas');
    t.width = Math.max(1, w / f | 0); t.height = Math.max(1, h / f | 0);
    const tc = t.getContext('2d'); tc.imageSmoothingQuality = 'high'; tc.drawImage(src, 0, 0, t.width, t.height);
    oc.imageSmoothingQuality = 'high'; oc.drawImage(t, 0, 0, w, h);
  }
  out.style.opacity = 0; L.wrap.appendChild(out); L.soft = out;
}

/* --- горы --- */
function paintMount(ctx) {
  const x0 = -.25 * W, x1 = 1.25 * W, yb = 1.3 * H;
  // тёплые бежевые горы без зелени: мягкий фон за парой
  const p1 = ridge(ctx, x0, x1, .5 * H, .07 * H, TAU / (W * 1.05), 1.3, '#d6cbb9', '#ece5d8', yb);
  hatch(ctx, p1, '#f1ebe0', .4, -.6, 6);
  const p2 = ridge(ctx, x0, x1, .575 * H, .045 * H, TAU / (W * .8), 4.1, '#cbbfab', '#e7ddcd', yb);
  hatch(ctx, p2, '#e9e0d1', .35, .55, 5);
  const g = ctx.createLinearGradient(0, .53 * H, 0, .72 * H);
  g.addColorStop(0, 'rgba(242,236,225,0)'); g.addColorStop(.6, 'rgba(242,236,225,.7)'); g.addColorStop(1, 'rgba(236,228,214,.95)');
  ctx.fillStyle = g; ctx.fillRect(x0, .53 * H, x1 - x0, yb - .53 * H);
}
/* --- холмы, рощи и луг --- */
function paintHills(ctx) {
  const x0 = -.25 * W, x1 = 1.25 * W, yb = 1.3 * H;
  const fA = TAU / (W * .75), phA = 2.2;
  ridge(ctx, x0, x1, .6 * H, .022 * H, fA, phA, '#a9b38f', '#9da985', yb);
  const PF = hazed(SAGE, .5);
  for (let x = x0; x < x1; x += rnd(6, 15) * U) {
    if (Math.abs(x - VP.x) < .1 * W && R() < .7) continue;
    const y = ridgeY(x, .6 * H, .022 * H, fA, phA) + 2;
    if (R() < .3) cypress(ctx, x, y, rnd(14, 26) * U, rnd(5, 7) * U, PF, { leaf: 1.4 * U });
    else clump(ctx, x, y - 4 * U, rnd(5, 10) * U, rnd(4, 7) * U, PF, { leaf: 1.5 * U });
  }
  const fB = TAU / (W * .9), phB = .4;
  ridge(ctx, x0, x1, .665 * H, .016 * H, fB, phB, '#9da983', '#909e75', yb);
  const PM = hazed(TREE, .38);
  for (let x = x0; x < x1; x += rnd(10, 24) * U) {
    if (Math.abs(x - VP.x) < .21 * W) continue;
    const y = ridgeY(x, .665 * H, .016 * H, fB, phB) + 3;
    if (R() < .35) cypress(ctx, x, y, rnd(26, 44) * U, rnd(8, 11) * U, PM, { leaf: 2 * U });
    else clump(ctx, x, y - 6 * U, rnd(9, 17) * U, rnd(7, 12) * U, PM, { leaf: 2.1 * U });
  }
  ridge(ctx, x0, x1, .712 * H, .008 * H, TAU / (W * 1.3), 1, '#a8b284', '#7c895a', yb);
  ctx.lineCap = 'round';
  for (const c of ['#8d9a68', '#97a472', '#7c8a58', '#a8b37f', '#6f7d4e']) {
    ctx.strokeStyle = c; ctx.globalAlpha = .5; ctx.lineWidth = 1; ctx.beginPath();
    for (let i = 0; i < 700; i++) {
      const y = .716 * H + Math.pow(R(), 1.4) * (yb - .716 * H), k = (y - .7 * H) / (.3 * H), x = rnd(x0, x1), l = (2 + k * 9) * U;
      ctx.moveTo(x, y); ctx.lineTo(x + rnd(-.4, .4) * l, y - l);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  for (const c of ['#fffaf0', '#f1c9cc', '#f5e2b8']) {
    const a = [];
    for (let i = 0; i < 150; i++) { const y = .725 * H + Math.pow(R(), 1.2) * .5 * H, k = (y - .7 * H) / (.3 * H); a.push(rnd(x0, x1), y, (.8 + k * 1.5) * U, 0, .8); }
    dabs(ctx, c, a);
  }
}
/* --- тропинка и цветочная арка --- */
function arcPt(cx, sy, r, th) { return [cx + Math.cos(th) * r, sy + Math.sin(th) * r]; }
function paintArch(ctx) {
  const cx = VP.x, base = .74 * H, rho = .22 * W, sy = base - .17 * H, yb = 1.3 * H;
  // тропинка
  const g = ctx.createLinearGradient(0, base, 0, H);
  g.addColorStop(0, '#e6dcc6'); g.addColorStop(1, '#d4c4a2');
  ctx.fillStyle = g; ctx.beginPath();
  ctx.moveTo(cx - .05 * W, base + 2);
  ctx.bezierCurveTo(cx - .1 * W, base + .1 * H, cx - .3 * W, yb - .3 * H, cx - .62 * W, yb);
  ctx.lineTo(cx + .62 * W, yb);
  ctx.bezierCurveTo(cx + .3 * W, yb - .3 * H, cx + .1 * W, base + .1 * H, cx + .05 * W, base + 2);
  ctx.closePath(); ctx.fill();
  // трава по краям тропинки
  const GE = ['#7f8c5c', '#8d9a68', '#6f7d4e'];
  for (const side of [-1, 1]) {
    const a = [];
    for (let i = 0; i < 260; i++) {
      const t = Math.pow(R(), .8), it = 1 - t;
      const p0 = [cx + side * .05 * W, base + 2], p1 = [cx + side * .1 * W, base + .1 * H], p2 = [cx + side * .3 * W, yb - .3 * H], p3 = [cx + side * .62 * W, yb];
      const x = it * it * it * p0[0] + 3 * it * it * t * p1[0] + 3 * it * t * t * p2[0] + t * t * t * p3[0];
      const y = it * it * it * p0[1] + 3 * it * it * t * p1[1] + 3 * it * t * t * p2[1] + t * t * t * p3[1];
      a.push(x + rnd(-1, 1) * (2 + t * 8) * U, y, (1.2 + t * 4) * U, rnd(-1, 1), .5);
    }
    dabs(ctx, pick(GE), a);
  }
  // живая изгородь у арки
  const PB = hazed(SAGE, .16);
  clump(ctx, cx - rho - .11 * W, base - .012 * H, .11 * W, .03 * H, PB, { leaf: 2.4 * U });
  clump(ctx, cx + rho + .12 * W, base - .01 * H, .12 * W, .032 * H, PB, { leaf: 2.4 * U });
}
/* --- пара (вырезана из студийного фона) стоит в саду за цветами; камера прилетает к ней --- */
// размеры: макушки на 19% высоты, низ фото уходит за клумбу (86%)
function coupleBox() {
  // пара крупно: макушки на 26% высоты (над ними имена), низ фото — у нижнего края экрана
  const ratio = 1061 / 1600, headTop = .089, head = .26 * H, bottom = H + 2;
  const h = (bottom - head) / (1 - headTop), w = h * ratio;
  return { x: VP.x - w / 2, y: head - headTop * h, w, h };
}
function paintCouple(L) {
  const b = coupleBox();
  // фото — отдельным элементом, чтобы оставалось чётким при любом увеличении
  const img = new Image(); img.className = 'couple'; img.alt = ''; img.decoding = 'async'; img.src = D.photos.couple;
  img.style.cssText = `left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px`;
  L.wrap.appendChild(img);
}
/* --- деревья по бокам у арки --- */
function paintMid(ctx) {
  const P = hazed(TREE, .14), PB = hazed(SAGE, .1);
  const up = -Math.PI / 2;
  tree(ctx, -.01 * W, .95 * H, { h: .16 * H, w: 17 * U, spread: .5, depth: 3, lean: -.05, cr: 44 * U, P, leaf: 3.4 * U, aMin: up - 1.05, aMax: up + .22 });
  tree(ctx, 1.01 * W, .96 * H, { h: .17 * H, w: 18 * U, spread: .5, depth: 3, lean: .05, cr: 46 * U, P, leaf: 3.4 * U, aMin: up - .22, aMax: up + 1.05 });
  clump(ctx, -.02 * W, .6 * H, .13 * W, .11 * H, P, { leaf: 3.4 * U });
  clump(ctx, 1.02 * W, .58 * H, .13 * W, .11 * H, P, { leaf: 3.4 * U });
  clump(ctx, .03 * W, .87 * H, .2 * W, .07 * H, PB, { leaf: 3.3 * U });
  clump(ctx, .99 * W, .85 * H, .2 * W, .075 * H, PB, { leaf: 3.3 * U });
}
/* --- лес, сквозь который пролетаем --- */
function paintNear2(ctx) {
  const P = hazed(TREE, .04);
  for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + .3, d = rnd(.34, .44) * W; clump(ctx, VP.x + Math.cos(a) * d * 1.15, VP.y + Math.sin(a) * d * 1.3, rnd(.15, .2) * W, rnd(.1, .14) * H, P, { leaf: 5 * U }); }
  for (let i = 0; i < 7; i++) clump(ctx, -.1 * W + i * .2 * W + rnd(-20, 20) * U, rnd(-.02, .08) * H, rnd(.16, .22) * W, rnd(.07, .1) * H, P, { leaf: 5 * U });
  const up = -Math.PI / 2;
  tree(ctx, .06 * W, 1.08 * H, { h: .3 * H, w: 30 * U, spread: .55, depth: 3, lean: -.08, cr: 62 * U, P, leaf: 5.2 * U, aMin: up - .9, aMax: up + .22 });
  tree(ctx, .95 * W, 1.1 * H, { h: .32 * H, w: 32 * U, spread: .55, depth: 3, lean: .08, cr: 64 * U, P, leaf: 5.2 * U, aMin: up - .22, aMax: up + .9 });
  clump(ctx, .2 * W, .98 * H, .34 * W, .12 * H, P, { leaf: 5 * U });
  clump(ctx, .82 * W, .97 * H, .32 * W, .12 * H, P, { leaf: 5 * U });
  clump(ctx, .5 * W, 1.03 * H, .3 * W, .08 * H, P, { leaf: 5 * U });
  hole(ctx, VP.x, VP.y, .1 * W, 6 * U);
}
function paintNear1(ctx) {
  limb(ctx, -.12 * W, .13 * H, .44 * W, .02 * H, 16 * U, 6 * U, '#2e2820', '#55493b');
  clump(ctx, .04 * W, .05 * H, .36 * W, .15 * H, TREE, { leaf: 8.5 * U });
  clump(ctx, .42 * W, -.01 * H, .26 * W, .08 * H, TREE, { leaf: 8.5 * U });
  clump(ctx, 1.04 * W, .4 * H, .22 * W, .24 * H, TREE, { leaf: 8.5 * U });
  clump(ctx, -.06 * W, .52 * H, .14 * W, .2 * H, TREE, { leaf: 8.5 * U });
  clump(ctx, -.02 * W, .97 * H, .36 * W, .15 * H, TREE, { leaf: 8.5 * U });
  clump(ctx, .95 * W, 1.0 * H, .32 * W, .12 * H, TREE, { leaf: 8.5 * U });
  hole(ctx, VP.x, VP.y, .3 * W, 10 * U);
}
function paintFg(ctx) {
  clump(ctx, -.04 * W, .9 * H, .32 * W, .2 * H, DARK, { leaf: 15 * U });
  clump(ctx, 1.02 * W, .08 * H, .3 * W, .16 * H, DARK, { leaf: 15 * U });
  clump(ctx, 1.06 * W, .76 * H, .16 * W, .18 * H, DARK, { leaf: 15 * U });
}
/* --- свисающие ветви сверху --- */
function paintBranches(ctx, side) {
  const P = hazed(SAGE, .05), P2 = hazed(TREE, .12);
  const xa = side < 0 ? -.06 * W : .54 * W, xb = side < 0 ? .46 * W : 1.06 * W;
  for (let x = xa; x < xb; x += rnd(2.5, 5.5) * U) {
    const edge = side < 0 ? 1 - (x - xa) / (xb - xa) : (x - xa) / (xb - xa);
    const len = (.035 + .26 * Math.pow(edge, 1.25) * rnd(.5, 1.1)) * H;
    strand(ctx, x, rnd(0, .035) * H, len, R() < .5 ? P : P2, 4.1 * U);
  }
  for (let x = xa; x < xb; x += .08 * W) {
    const edge = side < 0 ? 1 - (x - xa) / (xb - xa) : (x - xa) / (xb - xa);
    clump(ctx, x, rnd(-.03, -.005) * H, rnd(.08, .12) * W, (.025 + .035 * edge) * H, P2, { leaf: 3.3 * U });
  }
}
/* --- цветы снизу --- */
const LG = ['#4d5e38', '#5b6d42', '#3f4f2e', '#6f8250', '#7f9160'];
const RS = [ROSE.blush, ROSE.dusty, ROSE.cream, ROSE.white, ROSE.blush, ROSE.peach, ROSE.deep, ROSE.blush];
function paintFlowersBack(ctx) {
  // клумба выше по центру: закрывает низ фото пары
  const top = x => .8 * H - .09 * H * Math.pow(Math.min(1, Math.abs(x - .5 * W) / (.5 * W)), 1.4);
  for (let i = 0; i < 240; i++) { const x = rnd(-.05, 1.05) * W, l = rnd(14, 28) * U; leafP(ctx, x, top(x) + rnd(-.01, .16) * H, l, l * .32, -Math.PI / 2 + rnd(-.9, .9), pick(LG), pick(LG)); }
  const SP = [['#f3cfcc', '#dc9ea2'], ['#fbf3e6', '#e8d8bd'], ['#e7a9b2', '#c27884'], ['#ffffff', '#ebe3d6']];
  for (let i = 0; i < 18; i++) { const x = i % 2 ? rnd(-.02, .26) * W : rnd(.74, 1.02) * W; spike(ctx, x, top(x) + rnd(.03, .07) * H, rnd(.06, .12) * H, pick(SP)); }
  for (let i = 0; i < 34; i++) { const x = rnd(-.03, 1.03) * W; rose(ctx, x, top(x) + rnd(0, .07) * H, rnd(7, 12) * U, pick(RS)); }
  for (let i = 0; i < 30; i++) { const x = R() * W; blossom(ctx, x, top(x) + rnd(0, .09) * H, rnd(5, 8) * U, pick(['#fffdf6', '#fbeee6', '#f6d9d6']), '#e3b85c'); }
}
function paintFlowersFront(ctx) {
  const top = x => .935 * H - .12 * H * Math.pow(Math.min(1, Math.abs(x - .5 * W) / (.5 * W)), 1.2);
  ctx.fillStyle = '#2f3b24'; ctx.beginPath(); ctx.moveTo(-10, H + 10);
  for (let x = -10; x <= W + 10; x += 6) ctx.lineTo(x, top(x) + .035 * H);
  ctx.lineTo(W + 10, H + 10); ctx.closePath(); ctx.fill();
  for (let i = 0; i < 260; i++) { const x = rnd(-.05, 1.05) * W, l = rnd(16, 32) * U; leafP(ctx, x, top(x) + rnd(0, .1) * H, l, l * .34, -Math.PI / 2 + rnd(-1.1, 1.1), pick(LG), pick(LG)); }
  for (let i = 0; i < 8; i++) { const x = i % 2 ? rnd(-.02, .14) * W : rnd(.86, 1.02) * W; spike(ctx, x, top(x) + .05 * H, rnd(.08, .13) * H, pick([['#f3cfcc', '#dc9ea2'], ['#fbf3e6', '#e8d8bd']])); }
  for (let i = 0; i < 26; i++) { const x = rnd(-.04, 1.04) * W; rose(ctx, x, top(x) + rnd(.005, .07) * H, rnd(11, 18) * U, pick(RS)); }
  for (let i = 0; i < 34; i++) { const x = R() * W; blossom(ctx, x, top(x) + rnd(0, .08) * H, rnd(6, 9) * U, pick(['#fffdf6', '#fbeee6', '#f7dcd8']), '#e3b85c'); }
}

/* ---------- бумага конверта и печать ---------- */
const svgUrl = s => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
root.style.setProperty('--grain', svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='a' x='0' y='0'><feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 .96 0 0 0 ${THEME === 'burgundy' ? '.32 -.12' : '.6 -.2'}'/></filter><filter id='b' x='0' y='0'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' seed='4' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .12 0 0 0 0 .14 0 0 0 0 .08 0 0 0 .6 -.22'/></filter><rect width='240' height='240' filter='url(#a)'/><rect width='240' height='240' filter='url(#b)'/></svg>`));
root.style.setProperty('--marble', svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='600' height='1000' preserveAspectRatio='none'><filter id='m' x='0' y='0'><feTurbulence type='fractalNoise' baseFrequency='.004 .007' numOctaves='5' seed='7'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 .94 1.5 0 0 0 -.68'/></filter><rect width='600' height='1000' filter='url(#m)' opacity='${THEME === 'burgundy' ? .14 : .5}'/></svg>`));   // на вишнёвой бумаге разводы слабее, иначе она уходит в розовый
(() => {
  const sp = `<path d='M30 172 C58 140 78 112 96 62'/><path d='M50 148 C36 146 27 136 25 124 C39 126 49 134 50 148Z'/><path d='M58 138 C70 132 78 120 78 108 C66 112 58 124 58 138Z'/><path d='M69 120 C55 116 47 106 47 94 C61 98 69 108 69 120Z'/><path d='M79 104 C91 98 97 86 97 74 C85 78 79 90 79 104Z'/><path d='M89 82 C79 76 75 66 77 56 C87 62 91 72 89 82Z'/><path d='M140 30 C150 42 166 46 178 40 M152 38 C150 50 156 60 166 66'/><circle cx='150' cy='150' r='3.2'/><circle cx='161' cy='159' r='2.2'/><circle cx='145' cy='163' r='2.6'/><circle cx='156' cy='170' r='1.8'/>`;
  root.style.setProperty('--emboss', svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><g fill='none' stroke-linecap='round' stroke-width='1.2'><g stroke='rgba(255,255,245,.17)' transform='translate(-.7 -.7)'>${sp}</g><g stroke='rgba(36,44,24,.2)' transform='translate(.7 .7)'>${sp}</g></g></svg>`));
})();
function buildSeal() {
  seedFrom('seal');
  const n = 30, pts = [];
  for (let i = 0; i < n; i++) { const a = i / n * TAU, r = 51 + (R() - .5) * 5 + (i % 7 === 0 ? 3.5 : 0); pts.push([60 + Math.cos(a) * r, 60 + Math.sin(a) * r]); }
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], f = v => v.toFixed(1);
  const m0 = mid(pts[0], pts[1]); let d = `M${f(m0[0])} ${f(m0[1])}`;
  for (let i = 1; i <= n; i++) { const p = pts[i % n], m = mid(p, pts[(i + 1) % n]); d += `Q${f(p[0])} ${f(p[1])} ${f(m[0])} ${f(m[1])}`; }
  d += 'Z';
  let laurel = '';
  for (let i = 0; i < 8; i++) for (const s of [-1, 1]) {
    const ang = Math.PI / 2 + s * (.42 + i * .16), x = 60 + Math.cos(ang) * 30.5, y = 60 + Math.sin(ang) * 30.5;
    laurel += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="3.3" ry="1.25" transform="rotate(${f(ang * 180 / Math.PI + 90 + s * 28)} ${f(x)} ${f(y)})"/>`;
  }
  const [a, b] = D.initials;
  const mono = `${a}<tspan font-family="Great Vibes, cursive" font-size="20" font-weight="400" dx="2" dy="-2">&amp;</tspan><tspan dx="2" dy="2">${b}</tspan>`;
  // цвета воска: розовый (вариант 1) или белый (вариант 2, бордовая тема)
  const C = THEME === 'burgundy'
    ? { g: ['#ffffff', '#f2eee9', '#d3cbc2'], rim: '#6f655c', rimOp: .3, press: '#ddd5cc', pressOp: .5, hi: '#ffffff', lo: '#857a70', lauD: '#8a7f75', lauL: '#ffffff', txtD: '#7d7268', txtL: '#ffffff', txt: '#cfc6bc', shadow: '#2a0d15', gloss: .55 }
    : { g: ['#da959e', '#bd6d79', '#8b4250'], rim: '#5a2430', rimOp: .38, press: '#a85866', pressOp: .42, hi: '#f6cdd2', lo: '#6b2d3a', lauD: '#77343f', lauL: '#f3c4ca', txtD: '#6b2d3a', txtL: '#f8d6db', txt: '#b0606d', shadow: '#2b2418', gloss: .24 };
  $('sealSvg').innerHTML = `<defs>
    <radialGradient id="wx" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="${C.g[0]}"/><stop offset=".5" stop-color="${C.g[1]}"/><stop offset="1" stop-color="${C.g[2]}"/></radialGradient>
    <radialGradient id="wr" cx="50%" cy="50%" r="50%"><stop offset=".76" stop-color="${C.rim}" stop-opacity="0"/><stop offset="1" stop-color="${C.rim}" stop-opacity="${C.rimOp}"/></radialGradient>
    <filter id="ws" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="3.5" stdDeviation="3" flood-color="${C.shadow}" flood-opacity=".5"/></filter>
    <filter id="wb"><feGaussianBlur stdDeviation="2.6"/></filter></defs>
    <path d="${d}" fill="url(#wx)" filter="url(#ws)"/><path d="${d}" fill="url(#wr)"/>
    <circle cx="60" cy="60" r="37" fill="${C.press}" opacity="${C.pressOp}"/>
    <circle cx="60" cy="60" r="37.5" fill="none" stroke="${C.hi}" stroke-opacity=".55" stroke-width="1.6" transform="translate(-.8 -.8)"/>
    <circle cx="60" cy="60" r="37.5" fill="none" stroke="${C.lo}" stroke-opacity=".55" stroke-width="1.6" transform="translate(.8 .8)"/>
    <g fill="${C.lauD}" opacity=".55" transform="translate(.6 .6)">${laurel}</g><g fill="${C.lauL}" opacity=".55" transform="translate(-.5 -.5)">${laurel}</g>
    <g font-family="Noto Serif Armenian, serif" font-weight="400" font-size="26" text-anchor="middle">
      <text x="60" y="69" fill="${C.txtD}" opacity=".6" transform="translate(.9 .9)">${mono}</text>
      <text x="60" y="69" fill="${C.txtL}" opacity=".6" transform="translate(-.8 -.8)">${mono}</text>
      <text x="60" y="69" fill="${C.txt}">${mono}</text></g>
    <ellipse cx="42" cy="34" rx="16" ry="7" fill="#fff" opacity="${C.gloss}" transform="rotate(-32 42 34)" filter="url(#wb)"/>`;
}

/* ---------- сборка сцены ---------- */
let READY = false, pendingT = null, frozen = false, running = false, t0 = 0, unlocked = false, finished = false;
const env = $('env'), envPocket = $('envPocket'), envFlap = $('envFlap'), sealWrap = $('sealWrap'), seal = $('seal');
const envTop = env.querySelector('.env-top'), envNames = env.querySelector('.env-names'), envHint = env.querySelector('.env-hint');
const anim = [...document.querySelectorAll('.hero [data-a]')];
const hint = document.querySelector('.scroll-hint');
const tick = () => new Promise(r => setTimeout(r, 0));

async function build() {
  // окно может быть ещё не развёрнуто (нулевая ширина) — ждём настоящий размер
  for (let i = 0; i < 100 && hero.getBoundingClientRect().width < 50; i++) await new Promise(r => setTimeout(r, 100));
  const r = hero.getBoundingClientRect();
  W = Math.round(r.width); H = Math.round(r.height); U = W / 390; VP = { x: .5 * W, y: .62 * H };
  scene.style.cssText = `inset:auto;left:50%;top:50%;width:${W}px;height:${H}px;margin:${-H / 2}px 0 0 ${-W / 2}px;transform-origin:50% 62%`;
  // по просьбе Рафа без зелени: только бежевые горы и пара (лес, ветви и цветы отключены, функции остались выше)
  const jobs = [
    () => paintMount(camLayer('mount', 12, 'end', 1.3).ctx),
    () => paintCouple(camLayer('couple', 1.25, 'end', 1, false))
  ];
  const keys = ['mount', 'couple'];
  for (let i = 0; i < jobs.length; i++) { seedFrom(keys[i] + '-1013'); jobs[i](); render(frozen ? pendingT ?? 0 : 0); await tick(); }
  READY = true; env.classList.remove('loading');
  if (pendingT !== null) render(pendingT);
  else if (qs.has('skip')) introAt(99);
  else if (qs.has('t')) introAt(parseFloat(qs.get('t')) || 0);
  else if (wantStart) start();
  else render(0);
}

/* ---------- раскадровка (секунды после нажатия на печать) ---------- */
const T = {
  flap: [.12, 1.05], dive: [.8, 2.05], envFade: [1.6, 2.05], fly: [.6, 3.3],
  glow: [2.5, 3.6], n1: [2.7, 3.9], amp: [3.0, 4.0], n2: [3.1, 4.3], hint: [3.8, 4.6],
  unlock: 3.6, end: 4.6
};
const TRAVEL = 1.0;   // камера мягко приближается к паре (без леса — короткий путь)

function camera(e) {
  for (const L of CAM) {
    let dist, s;
    if (L.mode === 'end') { dist = L.z + TRAVEL * (1 - e); s = L.z / dist; }
    else { dist = L.z - TRAVEL * e; s = L.z / Math.max(dist, .02); }
    const op = L.mode === 'start' ? clamp((dist - .08) / .22) : 1;
    if (op <= 0) { L.wrap.style.visibility = 'hidden'; continue; }
    L.wrap.style.visibility = '';
    L.wrap.style.transform = `scale(${s.toFixed(4)})`;
    L.wrap.style.opacity = op < 1 ? op.toFixed(3) : '';
    if (L.soft) { const b = L.always ? 1 : clamp((s - 1.3) / 1.6); L.soft.style.opacity = b.toFixed(3); L.cv.style.opacity = b > .98 ? 0 : 1; }
  }
}
function render(t) {
  // конверт
  const press = t > 0 && t < .3 ? Math.sin(Math.PI * t / .3) : 0;
  const ang = ease(seg(t, T.flap)) * 178;
  envFlap.style.transform = `rotateX(${ang.toFixed(2)}deg)`;
  envFlap.classList.toggle('back', ang > 90);
  sealWrap.style.transform = `rotateX(${ang.toFixed(2)}deg)`;
  seal.style.transform = press ? `scale(${1 - .07 * press})` : '';
  seal.style.opacity = 1 - seg(ang, [50, 88]);
  const txt = 1 - seg(t, [.04, .4]);
  envTop.style.opacity = envNames.style.opacity = envHint.style.opacity = t > 0 ? txt : '';
  envPocket.style.transform = `scale(${(1 + 5.5 * easeIn(seg(t, T.dive))).toFixed(4)})`;
  env.style.opacity = 1 - seg(t, T.envFade);
  env.classList.toggle('gone', t >= T.envFade[1]);
  // камера
  const e = ease(seg(t, T.fly));
  camera(e);
  // надписи
  for (const el of anim) {
    const k = el.dataset.a, o = easeOut(seg(t, T[k]));
    el.style.opacity = o;
    if (k === 'glow') continue;
    const y = (1 - o) * (k === 'hint' ? 10 : 16);
    el.style.transform = k === 'hint' ? `translate(-50%, ${y}px)` : (o < 1 ? `translateY(${y}px)` : '');
    el.style.filter = o < 1 && k !== 'hint' ? `blur(${((1 - o) * 7).toFixed(2)}px)` : '';
  }
  if (t >= T.unlock) unlock();
}
function unlock() {
  if (unlocked) return; unlocked = true;
  document.body.classList.remove('locked');
  window.dispatchEvent(new Event('introdone'));
}
function finish() {
  if (finished) return; finished = true;
  render(T.end);
  // слои, через которые пролетели, больше не нужны — освобождаем память
  if (!frozen) for (const L of CAM) if (L.mode === 'start') { L.cv.width = L.cv.height = 1; if (L.soft) L.soft.width = L.soft.height = 1; L.wrap.remove(); }
}
function loop(now) {
  const t = (now - t0) / 1000;
  render(t);
  if (t < T.end) requestAnimationFrame(loop); else finish();
}
let wantStart = false, audio = null;
function start() {
  if (running) return;
  if (!READY) { wantStart = true; env.classList.add('loading'); return; }
  running = true;
  if (audio) audio.play().then(() => musicBtn.classList.remove('off')).catch(() => musicBtn.classList.add('off'));
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    env.style.transition = 'opacity .7s'; env.style.opacity = 0;
    setTimeout(() => { frozen = false; finish(); }, 700);
    return;
  }
  t0 = performance.now(); requestAnimationFrame(loop);
}
// для проверки раскадровки: introAt(2.5) показывает кадр на 2,5 с после нажатия
function introAt(t) {
  frozen = true;
  if (!READY) { pendingT = t; return; }
  if (t >= T.end) { render(T.end); unlock(); return; }
  render(t);
  if (t >= T.unlock) unlock();
}
window.introAt = introAt;

env.addEventListener('click', start);
seal.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); start(); } });

// музыка
const musicBtn = $('music');
if (D.music) {
  audio = new Audio(D.music); audio.loop = true; audio.preload = 'auto';
  musicBtn.hidden = false; musicBtn.classList.add('off');
  musicBtn.addEventListener('click', () => { if (audio.paused) { audio.play(); musicBtn.classList.remove('off'); } else { audio.pause(); musicBtn.classList.add('off'); } });
}

// при смене размера окна сцена масштабируется, чтобы закрывать экран
addEventListener('resize', () => {
  if (!READY) return;
  const r = hero.getBoundingClientRect(), k = Math.max(r.width / W, r.height / H);
  scene.style.transform = Math.abs(k - 1) > .01 ? `scale(${k.toFixed(4)})` : '';
});

if (qs.has('t') || qs.has('skip')) frozen = true;
buildSeal();
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => buildSeal());
build();
})();
