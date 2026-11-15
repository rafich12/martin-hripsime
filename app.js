/* Содержимое открытки: всё берётся из data.js */
(() => {
'use strict';
const D = window.WEDDING;
const $ = id => document.getElementById(id);
const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const p2 = n => String(n).padStart(2, '0');
const BURG = document.documentElement.dataset.theme === 'burgundy';   // второй вариант: бордовая тема

// «Թերթեք» прокручивает к фото скриптом: во втором варианте стоит <base href="../">, и простая ссылка #photo увела бы на первый
document.querySelector('.scroll-hint')?.addEventListener('click', e => {
  e.preventDefault();
  const to = document.getElementById('photo'), y0 = scrollY;
  to.scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => { if (Math.abs(scrollY - y0) < 2) to.scrollIntoView({ behavior: 'instant' }); }, 600);   // если плавная прокрутка не пошла
});

/* ---------- дата ---------- */
const MN = ['Հունվար', 'Փետրվար', 'Մարտ', 'Ապրիլ', 'Մայիս', 'Հունիս', 'Հուլիս', 'Օգոստոս', 'Սեպտեմբեր', 'Հոկտեմբեր', 'Նոյեմբեր', 'Դեկտեմբեր'];
const MG = ['հունվարի', 'փետրվարի', 'մարտի', 'ապրիլի', 'մայիսի', 'հունիսի', 'հուլիսի', 'օգոստոսի', 'սեպտեմբերի', 'հոկտեմբերի', 'նոյեմբերի', 'դեկտեմբերի'];
const WD = ['Երկ', 'Երք', 'Չրք', 'Հնգ', 'Ուր', 'Շբթ', 'Կիր'];
const dt = new Date(D.date);
D._ = {
  dd: p2(dt.getDate()), mm: p2(dt.getMonth() + 1), yy2: String(dt.getFullYear()).slice(2),
  dateDots: `${p2(dt.getDate())} · ${p2(dt.getMonth() + 1)} · ${dt.getFullYear()}`,
  dateDotsShort: `${p2(dt.getDate())}.${p2(dt.getMonth() + 1)}.${dt.getFullYear()}`,
  dateLong: `${dt.getDate()} ${MG[dt.getMonth()]} ${dt.getFullYear()}`,
  month: `${MN[dt.getMonth()]} ${dt.getFullYear()}`
};

/* ---------- тексты и фото из data.js ---------- */
const get = path => path.split('.').reduce((o, k) => o == null ? o : o[k], D);
// «և» заглавными должно быть «ԵՎ», а браузер делает «ԵՒ» — в заглавных блоках заменяем заранее
const upFix = (el, v) => getComputedStyle(el).textTransform === 'uppercase' ? String(v).replace(/և/g, 'եվ') : v;
document.querySelectorAll('[data-t]').forEach(el => { const v = get(el.dataset.t); if (v != null) el.textContent = upFix(el, v); });
document.querySelectorAll('img[data-photo]').forEach(img => { const src = D.photos[img.dataset.photo]; if (src) img.src = src; });
document.title = `${D.groom} & ${D.bride} — հարսանեկան հրավեր`;

/* ---------- рисованные мазки и веточки ---------- */
let S = 1;
function R() { S |= 0; S = S + 0x6D2B79F5 | 0; let t = Math.imul(S ^ S >>> 15, 1 | S); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
const rnd = (a, b) => a + (b - a) * R();
const pick = a => a[(R() * a.length) | 0];

// бежевый мазок акварельной кистью (как подложки в образце)
function brush(seed, w = 640, h = 240) {
  S = seed;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.translate(w / 2, h / 2); x.rotate(rnd(-.07, .04)); x.translate(-w / 2, -h / 2);
  x.lineCap = 'round';
  const cols = ['#e9dcc6', '#e2d2b7', '#efe5d4', '#dccaa9', '#e6d6bd'];
  for (let i = 0; i < 95; i++) {
    const v = (R() - .5) * 2, yy = h / 2 + v * h * .3, edge = Math.abs(v);
    const x0 = w * (.04 + R() * .1 + edge * edge * .16), x1 = w * (.96 - R() * .12 - edge * edge * .18);
    x.strokeStyle = pick(cols); x.globalAlpha = rnd(.25, .55); x.lineWidth = rnd(4, 18) * (1 - edge * .6);
    x.beginPath(); x.moveTo(x0, yy + rnd(-5, 5)); x.bezierCurveTo(w * .35, yy + rnd(-12, 12), w * .65, yy + rnd(-12, 12), x1, yy + rnd(-6, 6)); x.stroke();
  }
  x.globalAlpha = .35; x.strokeStyle = '#cbb592';
  for (let i = 0; i < 46; i++) {
    const yy = h / 2 + (R() - .5) * h * .58, x0 = w * rnd(.03, .45), x1 = x0 + w * rnd(.15, .5);
    x.lineWidth = rnd(.5, 1.5); x.beginPath(); x.moveTo(x0, yy); x.quadraticCurveTo((x0 + x1) / 2, yy + rnd(-4, 4), x1, yy + rnd(-3, 3)); x.stroke();
  }
  x.globalAlpha = .55; x.strokeStyle = '#faf6ee';
  for (let i = 0; i < 22; i++) {
    const yy = h / 2 + (R() - .5) * h * .5, x0 = w * rnd(.1, .6), x1 = x0 + w * rnd(.1, .35);
    x.lineWidth = rnd(.6, 2.2); x.beginPath(); x.moveTo(x0, yy); x.lineTo(x1, yy + rnd(-3, 3)); x.stroke();
  }
  return c.toDataURL('image/png');
}
function leaf(x, px, py, l, w, a, c1, c2) {
  x.save(); x.translate(px, py); x.rotate(a);
  x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(l * .5, -w, l, 0); x.quadraticCurveTo(l * .5, w, 0, 0); x.fillStyle = c1; x.fill();
  x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(l * .5, w, l, 0); x.closePath(); x.fillStyle = c2; x.fill();
  x.strokeStyle = 'rgba(255,255,240,.3)'; x.lineWidth = .7; x.beginPath(); x.moveTo(l * .08, 0); x.lineTo(l * .85, 0); x.stroke();
  x.restore();
}
// веточка оливы/эвкалипта для угла рамки календаря
function sprig(seed) {
  S = seed;
  const s = 360, c = document.createElement('canvas'); c.width = c.height = s;
  const x = c.getContext('2d');
  const cols = BURG
    ? [['#a32a4f', '#7f1a38'], ['#c46581', '#a0405e'], ['#851838', '#62102a'], ['#d692a6', '#b46c83']]
    : [['#8d9b6c', '#738256'], ['#a3b07f', '#86955f'], ['#7a8a5a', '#617047'], ['#b5c094', '#98a676']];
  const branch = (x0, y0, len, ang, bend, L) => {
    const N = 24, pts = []; let px = x0, py = y0, a = ang;
    for (let i = 0; i <= N; i++) { pts.push([px, py, a]); a += bend / N; px += Math.cos(a) * len / N; py += Math.sin(a) * len / N; }
    x.strokeStyle = BURG ? '#6e1630' : '#6a774f'; x.lineWidth = 1.5; x.lineCap = 'round';
    x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); pts.forEach(p => x.lineTo(p[0], p[1])); x.stroke();
    for (let i = 2; i < N; i += 2) {
      const [qx, qy, qa] = pts[i], t = i / N, l = L * (1 - t * .45) * rnd(.85, 1.15);
      for (const sd of [-1, 1]) { if (R() < .12) continue; const [c1, c2] = pick(cols); leaf(x, qx, qy, l, l * .3, qa + sd * rnd(.55, .95), c1, c2); }
    }
    const [tx, ty, ta] = pts[N], [c1, c2] = pick(cols); leaf(x, tx, ty, L * .55, L * .18, ta, c1, c2);
  };
  branch(24, 46, 300, .02, .95, 30);
  branch(46, 24, 250, 1.45, -.75, 27);
  branch(40, 40, 170, .72, .25, 22);
  x.fillStyle = BURG ? '#e3b7c4' : '#c9a9a4';
  for (let i = 0; i < 7; i++) { x.beginPath(); x.arc(rnd(70, 150), rnd(70, 150), rnd(2.5, 4), 0, Math.PI * 2); x.fill(); }
  return c.toDataURL('image/png');
}
const BR = [brush(11), brush(23), brush(37)];
const SPRIG = sprig(5);
document.querySelectorAll('.sprig').forEach(el => el.style.backgroundImage = `url(${SPRIG})`);
document.querySelectorAll('.brush-rsvp').forEach(el => el.style.backgroundImage = `url(${BR[1]})`);

/* ---------- значки ---------- */
const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.2l-1.4-1.3C5.4 15.2 2 12.2 2 8.4 2 5.4 4.4 3 7.4 3c1.7 0 3.4.8 4.6 2.1C13.2 3.8 14.9 3 16.6 3 19.6 3 22 5.4 22 8.4c0 3.8-3.4 6.8-8.6 11.5L12 21.2z"/></svg>';
const PIN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.2-5.4-6.2-10.2a6.2 6.2 0 0 1 12.4 0C18.2 15.6 12 21 12 21z"/><circle cx="12" cy="10.8" r="2.2"/></svg>';
const mapUrl = (m, place) => m || 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(place);

/* ---------- полоска дней и календарь ---------- */
const days = $('days');
for (let k = -2; k <= 2; k++) {
  const d = new Date(dt); d.setDate(dt.getDate() + k);
  const s = document.createElement('span');
  // в середине — пустое место: там стоит сердечко-ползунок с числом, которое потом едет по тропинке
  if (k === 0) { s.className = 'slot'; s.id = 'dayOn'; } else s.textContent = d.getDate();
  days.appendChild(s);
}
const grid = $('calGrid');
let g = WD.map(w => `<span class="wd">${w}</span>`).join('');
const first = new Date(dt.getFullYear(), dt.getMonth(), 1), off = (first.getDay() + 6) % 7, nd = new Date(dt.getFullYear(), dt.getMonth() + 1, 0).getDate();
g += '<span></span>'.repeat(off);
for (let d = 1; d <= nd; d++) g += d === dt.getDate() ? `<span class="on">${HEART}${d}</span>` : `<span>${d}</span>`;
grid.innerHTML = g;

/* ---------- таймер ---------- */
// в армянском после числа слово не меняется: «12 օր», поэтому подписи постоянные (в index.html)
const cEls = {}; document.querySelectorAll('[data-c]').forEach(b => cEls[b.dataset.c] = b);
function countdown() {
  const s = Math.max(0, Math.floor((dt - Date.now()) / 1000));
  const v = { d: Math.floor(s / 86400), h: Math.floor(s % 86400 / 3600), m: Math.floor(s % 3600 / 60), s: s % 60 };
  for (const k in v) cEls[k].textContent = k === 'd' ? v[k] : p2(v[k]);
}
countdown(); setInterval(countdown, 1000);

/* ---------- программа дня ---------- */
const route = $('route');
route.insertAdjacentHTML('beforeend', D.program.map((ev, i) => `
  <div class="ev ${i % 2 ? 'r' : 'l'} rv">
    <i class="brush" style="background-image:url(${BR[i % 3]})"></i>
    ${HEART.replace('<svg', '<svg class="pin"')}
    <p class="ev-time">${esc(ev.time)}</p>
    <p class="ev-title">${esc(ev.title)}</p>
    ${ev.place ? `<p class="ev-place">${esc(ev.place)}</p>` : ''}
    ${ev.map || ev.place ? `<a class="ev-map" href="${esc(mapUrl(ev.map, ev.place))}" target="_blank" rel="noopener">Քարտեզ</a>` : ''}
  </div>`).join(''));

/* ---------- места: наброски церкви и зала ---------- */
function hallSketch() {
  let w = '';
  for (const x0 of [36, 60, 84, 200, 224, 248]) {
    w += `<path d="M${x0} 102 H${x0 + 16} V124 H${x0} Z M${x0 + 8} 102 V124 M${x0} 112 H${x0 + 16}"/>`;
    w += `<path d="M${x0} 170 V148 A8 8 0 0 1 ${x0 + 16} 148 V170 Z M${x0 + 8} 141 V170 M${x0 - 3} 136 H${x0 + 19}"/>`;
  }
  let cols = '';
  for (const c of [122, 140, 160, 178]) cols += `<path d="M${c - 3} 81 V167 M${c + 3} 81 V167 M${c - 5} 81 H${c + 5} M${c - 5} 167 H${c + 5}"/>`;
  let ticks = '';
  for (let x = 28; x <= 108; x += 8) ticks += `M${x} 84 V92 M${x + 164} 84 V92 `;
  return `<path class="t" d="M8 194 H292 M40 199 H110 M190 199 H262"/>
    <path class="f" d="M26 186 V92 H112 V186 Z"/><path class="f" d="M188 186 V92 H274 V186 Z"/>
    <path d="M22 92 H116 M184 92 H278 M24 84 H114 M186 84 H276"/><path class="t" d="${ticks}"/>
    ${w}
    <path class="f" d="M112 186 V70 H188 V186 Z"/><path class="f" d="M105 70 L150 39 L195 70 Z"/>
    <path d="M115 65 L150 46 L185 65"/><circle cx="150" cy="58" r="5"/><path d="M112 78 H188"/>
    <path d="M143 167 V147 A7 7 0 0 1 157 147 V167"/>${cols}
    <path d="M106 172 H194 M100 178 H200 M94 184 H206"/>
    <path class="t" d="M270 100 L274 96 M270 112 L274 108 M270 124 L274 120 M270 136 L274 132 M270 148 L274 144 M270 160 L274 156 M270 172 L274 168"/>
    <path d="M12 192 C4 190 2 178 10 174 C8 164 20 158 26 166"/><path d="M288 192 C296 190 298 178 290 174 C292 164 280 158 274 166"/>`;
}
const SK = {
  church: { vb: '0 0 300 250', svg: `
    <path class="t" d="M14 236 H286 M60 241 H120 M170 241 H250"/>
    <path class="f" d="M131 101 V66 H169 V101 Z"/><path d="M140 100 V67 M160 100 V67 M127 66 H173"/>
    <path class="f" d="M124 66 L150 26 L176 66 Z"/><path d="M150 26 L140 66 M150 26 L160 66"/><path d="M150 26 V7 M144 13 H156"/>
    <path d="M147 94 V82 A3 3 0 0 1 153 82 V94"/>
    <path class="t" d="M163 72 L169 67 M163 80 L169 75 M163 88 L169 83 M163 96 L169 91 M157 50 L162 46 M160 58 L166 53"/>
    <path class="f" d="M64 228 V152 L106 130 V228 Z"/><path class="f" d="M236 228 V152 L194 130 V228 Z"/>
    <path d="M58 156 L106 130 M242 156 L194 130"/>
    <path d="M80 206 V190 A4 4 0 0 1 88 190 V206 M212 206 V190 A4 4 0 0 1 220 190 V206"/>
    <path class="f" d="M106 228 V130 L150 99 L194 130 V228 Z"/><path d="M99 134 L150 98 L201 134"/>
    <path d="M138 228 V198 A12 12 0 0 1 162 198 V228"/><path d="M132 228 V198 A18 18 0 0 1 168 198 V228"/>
    <path d="M146 174 V158 A4 4 0 0 1 154 158 V174"/><circle cx="150" cy="128" r="6"/><path class="t" d="M150 123 V133 M145 128 H155"/>
    <path class="t" d="M186 142 L194 136 M186 154 L194 148 M186 166 L194 160 M186 178 L194 172 M186 190 L194 184 M186 202 L194 196 M186 214 L194 208 M228 164 L236 158 M228 178 L236 172 M228 192 L236 186 M228 206 L236 200 M228 220 L236 214"/>
    <path d="M98 228 H202 M94 233 H206"/>
    <path d="M34 234 C24 204 27 166 38 136 C49 166 52 204 42 234"/><path class="t" d="M38 152 V230 M33 172 L38 178 M43 188 L38 194 M33 206 L38 212"/>
    <path d="M262 234 V206 M262 206 C238 208 236 182 250 176 C244 160 264 150 274 162 C288 156 298 174 288 184 C298 196 286 212 270 206"/>
    <path d="M48 234 C40 232 38 222 46 218 C46 208 58 206 62 212"/>` },
  hall: { vb: '0 0 300 210', svg: hallSketch() }
};
$('venues').innerHTML = D.venues.map((v, i) => {
  const k = SK[v.kind] || SK.hall;
  return `<div class="venue rv">
    <p class="venue-label">${esc(v.label)}</p>
    <p class="venue-name">${esc(v.name)}</p>
    <i class="brush" style="background-image:url(${BR[(i + 1) % 3]})"></i>
    <svg class="sketch" viewBox="${k.vb}" aria-hidden="true">${k.svg}</svg>
    ${v.place ? `<p class="venue-place">${esc(v.place)}</p>` : ''}
    <a class="btn-o" href="${esc(mapUrl(v.map, v.name + ', ' + v.place))}" target="_blank" rel="noopener">${PIN}Բացել քարտեզը</a>
  </div>`;
}).join('');
document.querySelectorAll('.sketch path, .sketch circle').forEach(el => el.setAttribute('pathLength', '1'));

/* ---------- анкета ---------- */
const form = $('rsvpForm');
// ответы приходят письмом на D.rsvp.email через formsubmit.co (первое письмо просит один раз нажать «Activate Form»)
const errEl = $('formErr'), ERR_FILL = errEl.textContent, ERR_SEND = 'Չհաջողվեց ուղարկել։ Խնդրում ենք փորձել կրկին։';
form.addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData(form);
  const name = String(fd.get('name') || '').trim(), attend = fd.get('attend');
  if (!name || !attend) { errEl.textContent = ERR_FILL; errEl.hidden = false; return; }
  if (fd.get('_honey')) return;                       // скрытое поле заполняют только спам-боты
  errEl.hidden = true;
  const btn = form.querySelector('button'), label = btn.textContent;
  btn.disabled = true; btn.textContent = 'Ուղարկվում է…';
  const count = String(fd.get('count') || '').trim();
  const body = {
    'Անուն Ազգանուն': name,
    'Կմասնակցի՞': attend,
    'Կողմ': fd.get('side') || '—',
    'Քանի՞ հոգի': count || (attend === 'Այո, սիրով' ? '1' : '—'),
    _subject: D.rsvp.subject, _template: 'table', _captcha: 'false'
  };
  try {
    const r = await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(D.rsvp.email), {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body)
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || (String(j.success) === 'false' && !/activat/i.test(j.message || ''))) throw new Error(j.message || r.status);
    form.hidden = true; $('rsvpDone').hidden = false;
  } catch (err) {
    errEl.textContent = ERR_SEND; errEl.hidden = false;
    btn.disabled = false; btn.textContent = label;
  }
});

/* ---------- тропинка программы и ползунок-сердечко с датой (как в образце) ----------
   Сердечко с числом стоит в полоске дней, а при прокрутке едет по пунктиру через всё расписание,
   держась у середины экрана, и останавливается на последнем пункте. */
const rtPath = $('rtPath'), rtMaskPath = $('rtMaskPath'), rtSvg = $('routeSvg'), rtMask = $('rtMask'), prog = $('program');
const slider = document.createElement('div');
slider.className = 'slider'; slider.setAttribute('aria-hidden', 'true');
slider.innerHTML = HEART + `<b>${dt.getDate()}</b>`;
route.appendChild(slider);
let track = [];   // точки пути через каждые 3px: [x, y, наибольший y до этой точки]
function catmull(p) {
  let d = `M${p[0].x.toFixed(1)} ${p[0].y.toFixed(1)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i - 1] || p[i], b = p[i], c = p[i + 1], e = p[i + 2] || c;
    d += ` C${(b.x + (c.x - a.x) / 6).toFixed(1)} ${(b.y + (c.y - a.y) / 6).toFixed(1)} ${(c.x - (e.x - b.x) / 6).toFixed(1)} ${(c.y - (e.y - b.y) / 6).toFixed(1)} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`;
  }
  return d;
}
// положение без учёта анимации появления: offsetTop не видит transform у .rv
function offsetIn(el, anc) { let x = 0, y = 0; while (el && el !== anc) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; } return { x, y }; }
function drawRoute() {
  const W = route.offsetWidth, H = route.offsetHeight;
  if (!W || !H) return;
  rtSvg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  rtMask.setAttribute('x', -60); rtMask.setAttribute('y', -300); rtMask.setAttribute('width', W + 120); rtMask.setAttribute('height', H + 600);
  const day = $('dayOn'), ro = offsetIn(route, prog), dO = offsetIn(day, prog);
  const pts = [{ x: dO.x + day.offsetWidth / 2 - ro.x, y: dO.y + day.offsetHeight / 2 - ro.y }];
  route.querySelectorAll('.ev').forEach(ev => {
    const pin = ev.querySelector('.pin'), er = ev.getBoundingClientRect(), pr = pin.getBoundingClientRect(), eo = offsetIn(ev, route);
    pts.push({ x: eo.x + pr.left - er.left + pr.width / 2, y: eo.y + pr.top - er.top + pr.height / 2 });
  });
  const all = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    all.push({ x: (a.x + b.x) / 2 + (i % 2 ? -1 : 1) * W * .09, y: (a.y + b.y) / 2 }, b);
  }
  const d = catmull(all);
  rtPath.setAttribute('d', d); rtMaskPath.setAttribute('d', d);
  rtMaskPath.style.strokeDasharray = 'none';
  const len = rtPath.getTotalLength();
  track = []; let my = -1e9;
  for (let l = 0; l < len + 3; l += 3) { const p = rtPath.getPointAtLength(Math.min(l, len)); my = Math.max(my, p.y); track.push([p.x, p.y, my]); }
  routeProgress();
}
function routeProgress() {
  if (!track.length) return;
  const target = innerHeight * .5 - route.getBoundingClientRect().top;
  let lo = 0, hi = track.length - 1;
  if (target <= track[0][2]) hi = 0;
  else while (lo < hi) { const mid = (lo + hi) >> 1; if (track[mid][2] < target) lo = mid + 1; else hi = mid; }
  slider.style.transform = `translate(${track[hi][0].toFixed(1)}px, ${track[hi][1].toFixed(1)}px)`;
}

/* ---------- появление блоков при прокрутке (без IntersectionObserver) ---------- */
const rvs = [...document.querySelectorAll('.rv')];
function reveal() {
  const vh = innerHeight;
  for (const el of rvs) {
    if (el.classList.contains('in')) continue;
    const r = el.getBoundingClientRect();
    if (r.top < vh * .9 && r.bottom > -40) el.classList.add('in');
  }
}
const sketches = [...document.querySelectorAll('.sketch')];
function drawSketches() {
  const vh = innerHeight;
  for (const s of sketches) {
    const r = s.getBoundingClientRect();
    s.style.setProperty('--d', (1.05 * (1 - clamp((vh * .95 - r.top) / (r.height + vh * .3)))).toFixed(3));
  }
}
function onScroll() { reveal(); routeProgress(); drawSketches(); }
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', () => { drawRoute(); onScroll(); });
addEventListener('introdone', () => { drawRoute(); onScroll(); });
addEventListener('load', () => { drawRoute(); onScroll(); });
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { drawRoute(); onScroll(); });
drawRoute();
})();
