/* Linea template · teeth that straighten with scroll, fit quiz, 22-hour clock, reviews marquee, booking. */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const G = !!(window.gsap && window.ScrollTrigger);
  const ANIM = G && !RM;
  const FINE = matchMedia('(pointer: fine)').matches;
  const NS = 'http://www.w3.org/2000/svg';
  if (!ANIM) root.classList.remove('anim');
  if (G) gsap.registerPlugin(ScrollTrigger);
  window.__ready = true;
  const shown = els => () => els.forEach(e => { e.classList.add('shown'); e.style.transform = ''; e.style.opacity = ''; });
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const sstep = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (!RM && window.Lenis && FINE) {
    lenis = new Lenis({ lerp: 0.1 });
    if (G) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
    else { const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'), t = id.length > 1 && $(id); if (!t) return;
    e.preventDefault(); closeMenu(); lenis ? lenis.scrollTo(t, { offset: id === '#journey' ? 0 : -80 }) : t.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
  }));

  /* ---------- header, menu, demo badge, toast ---------- */
  const hdr = $('#hdr'), demo = $('.demo'); let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY; hdr.classList.toggle('scrolled', y > 30);
    if (demo) { const first = y < innerHeight * 0.7, phone = innerWidth < 641;
      if (first || (phone && y > lastY + 6)) demo.classList.add('tuck'); else if (!phone || y < lastY - 6) demo.classList.remove('tuck'); }
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const menuBtn = $('#menuBtn'), sheet = $('#sheet');
  function closeMenu() { sheet.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); sheet.setAttribute('aria-hidden', 'true'); lenis && lenis.start(); }
  menuBtn.addEventListener('click', () => { const open = !sheet.classList.contains('open'); sheet.classList.toggle('open', open); menuBtn.setAttribute('aria-expanded', String(open)); sheet.setAttribute('aria-hidden', String(!open)); lenis && (open ? lenis.stop() : lenis.start()); });
  const toast = $('#toast'); let tt;
  const say = m => { toast.textContent = m; toast.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('show'), 4600); };

  /* ---------- the arch: 14 upper teeth on an elliptical curve, seen from below ---------- */
  const svg = $('#arch');
  const A = 205, B = 300, CX = 300, TOP = 40, GAP = 4;
  const TEETH = [ // width along the arch, depth, roundness, groove type
    { w: 56, h: 26, r: 0.42, g: 0 }, { w: 46, h: 24, r: 0.45, g: 0 }, { w: 40, h: 36, r: 0.5, g: 0 },
    { w: 40, h: 44, r: 0.42, g: 1 }, { w: 40, h: 44, r: 0.42, g: 1 }, { w: 52, h: 56, r: 0.36, g: 2 }, { w: 50, h: 54, r: 0.36, g: 2 }];
  const CROOK = { // dn: push in or out (px), dr: twist (deg), ds: slide along the arch (px)
    R: [{ dn: -10, dr: 18, ds: -4 }, { dn: 16, dr: -24, ds: 3 }, { dn: -14, dr: 12, ds: 6 }, { dn: 7, dr: 10, ds: 4 }, { dn: -5, dr: -9, ds: 2 }, { dn: 3, dr: 5, ds: 0 }, { dn: 0, dr: -3, ds: 0 }],
    L: [{ dn: 9, dr: -14, ds: -3 }, { dn: -13, dr: 21, ds: -5 }, { dn: 13, dr: -16, ds: 6 }, { dn: -6, dr: -11, ds: 3 }, { dn: 5, dr: 8, ds: 2 }, { dn: -2, dr: -4, ds: 0 }, { dn: 2, dr: 3, ds: 0 }] };
  // sample the ellipse by arc length
  const samples = []; let acc = 0, px = CX, py = TOP;
  for (let i = 0; i <= 1600; i++) { const t = i / 1000, x = CX + A * Math.sin(t), y = TOP + B * (1 - Math.cos(t)); acc += Math.hypot(x - px, y - py); px = x; py = y; samples.push({ t, s: acc }); }
  const tAt = s => { let lo = 0, hi = samples.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (samples[m].s < s) lo = m + 1; else hi = m; } return samples[lo].t; };
  const frame = (t, side) => { const dx = A * Math.cos(t), dy = B * Math.sin(t), l = Math.hypot(dx, dy), tx = dx / l, ty = dy / l;
    return { x: CX + side * A * Math.sin(t), y: TOP + B * (1 - Math.cos(t)), tx: side * tx, ty, nx: side * ty, ny: -tx }; };
  // place teeth by arc length from the midline
  const teeth = [];
  ['R', 'L'].forEach(sideKey => {
    const side = sideKey === 'R' ? 1 : -1; let s = GAP / 2;
    TEETH.forEach((T, i) => {
      s += T.w / 2; const sCenter = s; s += T.w / 2 + GAP;
      const g = document.createElementNS(NS, 'g');
      const rect = document.createElementNS(NS, 'rect');
      rect.setAttribute('class', 'tooth'); rect.setAttribute('x', -T.w / 2); rect.setAttribute('y', -T.h / 2); rect.setAttribute('width', T.w); rect.setAttribute('height', T.h);
      rect.setAttribute('rx', Math.min(T.w, T.h) * T.r); g.appendChild(rect);
      if (T.g) { const p = document.createElementNS(NS, 'path'); const a = T.w * 0.22, b = T.h * 0.2;
        p.setAttribute('d', T.g === 1 ? `M${-a} 0H${a}` : `M${-a} 0H${a}M0 ${-b}V${b}`); p.setAttribute('stroke', '#d9e4ee'); p.setAttribute('stroke-width', 2); p.setAttribute('stroke-linecap', 'round'); g.appendChild(p); }
      svg.appendChild(g);
      teeth.push({ g, side, sCenter, c: CROOK[sideKey][i] });
    });
  });
  // the clear tray: a wide translucent stroke along the ideal arch, plus a glossy edge
  const ideal = teeth.filter(t => t.side === 1).map(t => frame(tAt(t.sCenter), 1));
  const pathThrough = (pts, off) => pts.map((f, i) => `${i ? 'L' : 'M'}${(f.x + f.nx * off).toFixed(1)} ${(f.y + f.ny * off).toFixed(1)}`).join('');
  const leftPts = ideal.map(f => ({ ...f, x: 2 * CX - f.x, nx: -f.nx })).reverse();
  const all = [...leftPts, ...ideal];
  const tray = document.createElementNS(NS, 'path'); tray.setAttribute('class', 'tray-path'); tray.setAttribute('d', pathThrough(all, 0)); tray.setAttribute('stroke-width', 72); tray.style.opacity = 0;
  const gloss = document.createElementNS(NS, 'path'); gloss.setAttribute('d', pathThrough(all, 30)); gloss.setAttribute('fill', 'none'); gloss.setAttribute('stroke', '#ffffff'); gloss.setAttribute('stroke-width', 2.5); gloss.setAttribute('stroke-linecap', 'round'); gloss.style.opacity = 0;
  svg.appendChild(tray); svg.appendChild(gloss);
  // fit the viewBox to the teeth
  { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; all.forEach(f => { x0 = Math.min(x0, f.x); x1 = Math.max(x1, f.x); y0 = Math.min(y0, f.y); y1 = Math.max(y1, f.y); });
    const pad = 54; svg.setAttribute('viewBox', `${(x0 - pad).toFixed(0)} ${(y0 - pad).toFixed(0)} ${(x1 - x0 + 2 * pad).toFixed(0)} ${(y1 - y0 + 2 * pad).toFixed(0)}`); }

  const story = $('#journey'), wk = $('#wk'), trayN = $('#trayN'), jbar = $('#jbar'), miles = $$('#miles li');
  let lastP = -1, lastM = -1;
  function drawArch(p) {
    const q = sstep(0.06, 0.9, p);
    teeth.forEach(T => {
      const k = 1 - q, f = frame(tAt(T.sCenter + T.c.ds * k), T.side);
      const x = f.x + f.nx * T.c.dn * k, y = f.y + f.ny * T.c.dn * k, ang = Math.atan2(f.ty, f.tx) * 180 / Math.PI + T.c.dr * k;
      T.g.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${ang.toFixed(2)})`);
    });
    const tr = sstep(0.08, 0.18, p) * (1 - 0.65 * sstep(0.9, 0.98, p));
    tray.style.opacity = (tr * 0.26).toFixed(3); gloss.style.opacity = (tr * 0.55).toFixed(3);
    wk.textContent = String(Math.round(p * 40)).padStart(2, '0');
    trayN.textContent = p > 0.97 ? 'Retainer' : `Tray ${Math.min(20, 1 + Math.floor(p * 20))} of 20`;
    jbar.style.transform = `scaleX(${p.toFixed(4)})`;
    const m = p < 0.15 ? 0 : p < 0.5 ? 1 : p < 0.86 ? 2 : 3;
    if (m !== lastM) { lastM = m; miles.forEach((li, i) => li.classList.toggle('on', i === m)); }
  }
  let ticking = false;
  const journeyTick = () => {
    ticking = false;
    const r = story.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    const p = RM ? 1 : clamp(-r.top / Math.max(1, r.height - innerHeight));
    if (Math.abs(p - lastP) > 0.0005) { lastP = p; drawArch(p); }
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(journeyTick); } }, { passive: true });
  addEventListener('resize', journeyTick);
  drawArch(RM ? 1 : 0); journeyTick();

  /* ---------- quiz ---------- */
  const steps = $$('.qstep'), bars = $$('.qbar span'), back = $('#qBack'), ans = {};
  let qs = 0;
  const showQ = i => { qs = i; steps.forEach((s, k) => s.classList.toggle('on', k === i)); bars.forEach((b, k) => b.classList.toggle('on', k < i || i === 3)); back.hidden = i === 0 || i === 3; };
  const KEYS = ['fix', 'sev', 'who'];
  $$('.qstep[data-q] .qopts').forEach((box, i) => $$('button', box).forEach(b => b.addEventListener('click', () => { ans[KEYS[i]] = b.dataset.v; if (i < 2) showQ(i + 1); else { result(); showQ(3); } })));
  back.addEventListener('click', () => showQ(Math.max(0, qs - 1)));
  $('#qAgain').addEventListener('click', () => showQ(0));
  const FIXNAME = { crowding: 'Crowded teeth', gaps: 'Gaps between teeth', bite: 'Overbite or underbite', relapse: 'Teeth moved after braces' };
  function result() {
    const months = ans.fix === 'relapse' && ans.sev !== 'severe' ? '3–6' : { mild: '3–6', moderate: '6–12', severe: '12–18' }[ans.sev];
    let plan = 'Complete', price = '₹1,10,000';
    if (ans.who === 'teen') { plan = 'Teen'; price = '₹95,000'; }
    else if (ans.sev === 'mild' || ans.fix === 'relapse') { plan = 'Lite'; price = '₹55,000'; }
    const text = ans.fix === 'bite' && ans.sev === 'severe' ? 'Usually yes. Bigger bite corrections sometimes need small attachments or elastics, and your free scan will tell us for sure.'
      : ans.fix === 'gaps' ? 'Good news: closing gaps is one of the quickest things aligners do.'
      : ans.fix === 'relapse' ? 'Very common, and usually quick to fix. Most people are done in a few months.'
      : 'Good news: this is exactly what clear aligners are best at.';
    $('#rMonths').textContent = months; $('#rPlan').textContent = 'Linea ' + plan; $('#rPrice').textContent = price; $('#rText').textContent = text;
    $('#rGo').dataset.fix = FIXNAME[ans.fix];
  }
  $('#rGo').addEventListener('click', () => { const v = $('#rGo').dataset.fix; if (v) $('#fix').value = v; });

  /* ---------- 22-hour clock ---------- */
  const C = 2 * Math.PI * 90, segs = $('#segs');
  const MEALS = [[8, 8.67], [13.5, 14.17], [20.5, 21.17]];
  const parts = []; let h = 0;
  MEALS.forEach(([a, b]) => { parts.push(['w', h, a]); parts.push(['m', a, b]); h = b; }); parts.push(['w', h, 24]);
  const segEls = parts.map(([k, a, b]) => {
    const c = document.createElementNS(NS, 'circle'), len = (b - a) / 24 * C - 2;
    c.setAttribute('class', 'seg ' + k); c.setAttribute('cx', 110); c.setAttribute('cy', 110); c.setAttribute('r', 90);
    c.setAttribute('stroke-dasharray', `${len} ${C}`); c.setAttribute('stroke-dashoffset', (-(a / 24 * C + 1)).toFixed(2));
    segs.appendChild(c); return { c, len };
  });
  const clock = $('#clock');
  [['12 AM', 50, 21], ['6 AM', 79, 50], ['12 PM', 50, 79], ['6 PM', 21, 50]].forEach(([t, x, y]) => { const s = document.createElement('span'); s.className = 'hr'; s.textContent = t; s.style.left = x + '%'; s.style.top = y + '%'; s.style.transform = 'translate(-50%,-50%)'; clock.appendChild(s); });

  /* ---------- reviews marquee: duplicate rows so the loop is seamless ---------- */
  $$('.mrow').forEach(r => { [...r.children].forEach(c => { const d = c.cloneNode(true); d.setAttribute('aria-hidden', 'true'); r.appendChild(d); }); });

  /* ---------- FAQ ---------- */
  $$('.qa details').forEach(d => {
    const s = $('summary', d), b = $('.qa-b', d);
    s.addEventListener('click', e => {
      if (RM || !b.animate) return; e.preventDefault();
      if (d.open) { const hh = b.offsetHeight; b.animate([{ height: hh + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 300, easing: 'ease' }).onfinish = () => (d.open = false); }
      else { d.open = true; const hh = b.offsetHeight; b.animate([{ height: '0px', opacity: 0 }, { height: hh + 'px', opacity: 1 }], { duration: 440, easing: 'cubic-bezier(.2,.8,.2,1)' }); }
    });
  });

  /* ---------- booking ---------- */
  const press = (box, btn) => $$('button', box).forEach(x => x.setAttribute('aria-pressed', String(x === btn)));
  $$('#studios button').forEach(b => b.addEventListener('click', () => press($('#studios'), b)));
  $$('#tod button').forEach(b => b.addEventListener('click', () => press($('#tod'), b)));
  const now = new Date(Date.now() + (new Date().getTimezoneOffset() + 330) * 60000), datesEl = $('#dates');
  const startK = now.getHours() >= 19 ? 1 : 0;
  datesEl.innerHTML = Array.from({ length: 7 }, (_, j) => { const k = j + startK, d = new Date(now); d.setDate(now.getDate() + k);
    const lab = k === 0 ? 'Today' : k === 1 ? 'Tmrw' : d.toLocaleDateString('en-IN', { weekday: 'short' });
    return `<button type="button" aria-pressed="${j === 0}" data-l="${k === 0 ? 'today' : k === 1 ? 'tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'long' })}">${lab}<b>${d.getDate()}</b></button>`; }).join('');
  $$('button', datesEl).forEach(b => b.addEventListener('click', () => press(datesEl, b)));
  $('#bform').addEventListener('submit', e => {
    e.preventDefault();
    const nm = $('#nm'), ph = $('#ph');
    if (nm.value.trim().length < 2) { nm.focus(); return say('Please add your name.'); }
    if (!/^[6-9]\d{9}$/.test(ph.value.replace(/\D/g, '').slice(-10))) { ph.focus(); return say('Please add a 10-digit mobile number so we can confirm on WhatsApp.'); }
    const st = $('#studios [aria-pressed="true"]').dataset.s, d = $('#dates [aria-pressed="true"]').dataset.l, t = $('#tod [aria-pressed="true"]').dataset.t.toLowerCase();
    say(`Demo template: on your clinic’s site this request (${st}, ${d} ${t}) lands in your WhatsApp.`);
    nm.value = ''; ph.value = '';
  });

  /* ---------- motion ---------- */
  const drawClock = () => segEls.forEach(({ c, len }, i) => { if (!ANIM) return; c.setAttribute('stroke-dasharray', `0 ${C}`); gsap.to({ v: 0 }, { v: len, duration: 0.5, delay: i * 0.18, ease: 'power2.out', onUpdate() { c.setAttribute('stroke-dasharray', `${this.targets()[0].v} ${C}`); } }); });
  if (!ANIM) return;
  segEls.forEach(({ c }) => c.setAttribute('stroke-dasharray', `0 ${C}`));
  ScrollTrigger.create({ trigger: clock, start: 'top 80%', once: true, onEnter: drawClock });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    const ups = $$('.hero [data-up]');
    gsap.timeline({ delay: 0.1 })
      .from('.hdr', { yPercent: -120, opacity: 0, duration: 0.8, ease: 'power3.out', clearProps: 'transform,opacity' }, 0)
      .to(ups, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.08, onComplete: shown(ups) }, 0.1)
      .from('.hero-art .ph', { clipPath: 'inset(100% 0 0 0 round 40px)', duration: 1.3, ease: 'expo.inOut' }, 0.2)
      .from('.float', { scale: 0.6, opacity: 0, duration: 0.8, ease: 'back.out(1.8)', stagger: 0.15, clearProps: 'transform,opacity' }, 0.9);
    gsap.to('.f-tray', { y: -10, duration: 2.4, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 2 });
    gsap.to('.f-wear', { y: 10, duration: 2.8, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 2 });
    ScrollTrigger.batch($$('[data-up]').filter(el => !el.closest('.hero')), { start: 'top 90%', once: true, onEnter: els => gsap.to(els, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07, onComplete: shown(els) }) });
    gsap.from('.word', { yPercent: 35, ease: 'none', scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'bottom bottom', scrub: true } });
    addEventListener('load', () => ScrollTrigger.refresh());
  });
})();
