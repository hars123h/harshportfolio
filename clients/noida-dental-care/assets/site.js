/* Noida Dental Care · interactions (no libraries) */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const root = document.documentElement, top = $('#top'), D = window.NDC || {};
  const store = { get(k){ try { return sessionStorage.getItem(k); } catch(_) { return null; } }, set(k, v){ try { sessionStorage.setItem(k, v); } catch(_) {} } };
  const inr = n => '₹' + n.toLocaleString('en-IN');

  /* ---------- header ---------- */
  const setH = () => root.style.setProperty('--hh', top.offsetHeight + 'px');
  if ($('#ribbon') && store.get('rb-hide')) $('#ribbon').remove();
  $('.rb-x')?.addEventListener('click', () => { store.set('rb-hide', '1'); $('#ribbon')?.remove(); setH(); });
  setH(); if (window.ResizeObserver) new ResizeObserver(setH).observe(top); else addEventListener('resize', setH);
  let locked = false, lockY = 0;
  addEventListener('scroll', () => { if (!locked) top.classList.toggle('scrolled', scrollY > 8); }, { passive: true });
  const sheet = $('#sheet'), menuBtn = $('.menu-btn');
  function lock(on) {
    const b = document.body.style;
    if (on && !locked) { locked = true; lockY = scrollY; Object.assign(b, { position: 'fixed', top: -lockY + 'px', left: '0', right: '0', width: '100%' }); }
    else if (!on && locked) { Object.assign(b, { position: '', top: '', left: '', right: '', width: '' }); scrollTo({ top: lockY, behavior: 'instant' }); locked = false; }
  }
  function setMenu(open) { sheet.classList.toggle('open', open); sheet.setAttribute('aria-hidden', !open); menuBtn.setAttribute('aria-expanded', open); menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); root.classList.toggle('menu-open', open); lock(open); }
  menuBtn?.addEventListener('click', () => setMenu(!sheet.classList.contains('open')));
  sheet?.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && sheet?.classList.contains('open')) { setMenu(false); menuBtn.focus(); } });
  matchMedia('(min-width:1100px)').addEventListener?.('change', m => { if (m.matches && sheet.classList.contains('open')) setMenu(false); });

  /* ---------- reveal ---------- */
  const rv = $$('.rv');
  if (!RM && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target, sib = [...el.parentElement.children].filter(c => c.classList.contains('rv'));
      el.style.transitionDelay = Math.min(sib.indexOf(el), 4) * 70 + 'ms'; el.classList.add('shown'); io.unobserve(el);
      el.addEventListener('transitionend', () => { el.style.transitionDelay = ''; }, { once: true });
    }), { rootMargin: '0px 0px -8% 0px', threshold: .06 });
    rv.forEach(el => io.observe(el));
  } else rv.forEach(el => el.classList.add('shown'));

  /* ---------- opening status (IST) ---------- */
  const mins = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const fmt = t => { let [h, m] = t.split(':').map(Number); const s = h < 12 ? 'am' : 'pm'; if (h > 12) h -= 12; return `${h}:${String(m).padStart(2, '0')} ${s}`; };
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  function ist() {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date()).map(x => [x.type, x.value]));
    return { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday), m: (+p.hour % 24) * 60 + +p.minute };
  }
  function status() {
    const H = D.hours || {}, { day, m } = ist(), today = H[day] || [];
    for (const [a, b] of today) if (m >= mins(a) && m < mins(b)) return { c: mins(b) - m <= 45 ? 'soon' : 'open', h: `<b>Open now</b> · until ${fmt(b)}` };
    const later = today.find(([a]) => mins(a) > m);
    if (later) return { c: 'closed', h: `<b>Closed now</b> · opens today at ${fmt(later[0])}` };
    for (let i = 1; i <= 7; i++) { const d = (day + i) % 7; if ((H[d] || []).length) return { c: 'closed', h: `<b>Closed${day === 2 ? ' on Tuesdays' : ' now'}</b> · opens ${i === 1 ? 'tomorrow' : DAYS[d]} at ${fmt(H[d][0][0])}` }; }
    return { c: '', h: 'Opening hours' };
  }
  const paint = () => { const s = status(); $$('[data-status]').forEach(el => { el.classList.remove('open', 'closed', 'soon'); if (s.c) el.classList.add(s.c); $('span', el).innerHTML = s.h; }); const { day } = ist(); $$('.hours tr').forEach(tr => tr.classList.toggle('today', +tr.dataset.day === day)); };
  paint(); setInterval(paint, 60000);

  /* ---------- microscope lens ---------- */
  const stage = $('[data-lens]');
  if (stage) {
    const base = $('.ls-base', stage), lens = $('.ls-lens', stage), inner = $('.ls-in', stage), xy = $('.xy', stage);
    const Z = 2.6; let tx = .5, ty = .36, cx = tx, cy = ty, follow = false, idle = 0, visible = true, t0 = performance.now(), raf = 0;
    const layout = () => { const b = base.getBoundingClientRect(); inner.style.setProperty('--sw', b.width * Z + 'px'); inner.style.setProperty('--sh', b.height * Z + 'px'); };
    function place(fx, fy) {
      const s = stage.getBoundingClientRect(), b = base.getBoundingClientRect(), L = lens.offsetWidth;
      const px = fx * s.width, py = fy * s.height;
      lens.style.setProperty('--lx', (px - L / 2) + 'px'); lens.style.setProperty('--ly', (py - L / 2) + 'px');
      const bx = px - (b.left - s.left), by = py - (b.top - s.top);
      inner.style.setProperty('--ix', (L / 2 - bx * Z) + 'px'); inner.style.setProperty('--iy', (L / 2 - by * Z) + 'px');
      if (xy) xy.textContent = `x ${Math.round(bx / b.width * 400)} · y ${Math.round(by / b.height * 540)}`;
    }
    function loop(now) {
      if (!follow && !RM && now > idle) { const t = (now - t0) / 1000; tx = .5 + Math.sin(t * .45) * .16; ty = .42 + Math.sin(t * .7 + 1) * .22; }
      cx += (tx - cx) * (RM ? 1 : .12); cy += (ty - cy) * (RM ? 1 : .12); place(cx, cy);
      raf = visible ? requestAnimationFrame(loop) : 0;
    }
    const pt = e => { const s = stage.getBoundingClientRect(); return [Math.min(.92, Math.max(.08, (e.clientX - s.left) / s.width)), Math.min(.92, Math.max(.08, (e.clientY - s.top) / s.height))]; };
    stage.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' || e.buttons) { follow = true; [tx, ty] = pt(e); } });
    stage.addEventListener('pointerdown', e => { follow = true; [tx, ty] = pt(e); });
    const release = () => { follow = false; idle = performance.now() + 2500; t0 = performance.now() - 2000; };
    stage.addEventListener('pointerleave', release); stage.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') release(); });
    layout(); addEventListener('resize', layout);
    if ('IntersectionObserver' in window) new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(loop); }).observe(stage);
    raf = requestAnimationFrame(loop);
  }

  /* ---------- root canal story ---------- */
  $$('[data-story]').forEach(st => {
    const svg = $('svg', st), steps = $$('.rs-step', st), num = $('.rs-n', st);
    const set = li => { steps.forEach(s => s.classList.toggle('on', s === li)); svg.setAttribute('class', 'tooth-svg story st-' + li.dataset.state); num.textContent = String(steps.indexOf(li) + 1).padStart(2, '0'); };
    set(steps[0]);
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) set(en.target); }), { rootMargin: '-48% 0px -48% 0px' });
      steps.forEach(s => io.observe(s));
    }
    steps.forEach(s => s.addEventListener('click', () => set(s)));
  });

  /* ---------- implant: freehand vs guided ---------- */
  $$('[data-impl]').forEach(box => {
    const fig = $('.impl-fig', box), btns = $$('[data-mode]', box); let touched = false;
    const set = m => { fig.classList.toggle('mode-manual', m === 'manual'); fig.classList.toggle('mode-guided', m === 'guided'); btns.forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === m)); };
    btns.forEach(b => b.addEventListener('click', () => { touched = true; set(b.dataset.mode); }));
    if (!RM && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { io.disconnect(); setTimeout(() => { if (!touched) set('guided'); }, 1600); } }, { threshold: .6 });
      io.observe(box);
    }
  });

  /* ---------- fears ---------- */
  $$('[data-fears]').forEach(f => $$('.fear', f).forEach(b => b.addEventListener('click', () => {
    $$('.fear', f).forEach(x => x.setAttribute('aria-pressed', x === b)); $$('.fa', f).forEach(a => a.hidden = a.dataset.for !== b.dataset.fear);
  })));

  /* ---------- price explorer ---------- */
  $$('[data-prices]').forEach(px => {
    const P = D.prices || [], opts = $('#pxOpts', px), qtyBox = $('#pxQty', px), nEl = $('#pxN', px), add = $('#pxAdd', px), tot = $('#pxTotal', px), on = $('#pxOn', px), note = $('#pxNote', px), waBtn = $('#pxWa', px);
    let cat = P[0], oi = 0, qty = 1;
    function render() {
      opts.innerHTML = cat.options.map(([n, v, s], i) => `<button type="button" class="opt" role="radio" aria-checked="${i === oi}" data-i="${i}"><span>${n}</span><b>${inr(v)}${s && s !== 'onwards' ? ' ' + s : ''}${s === 'onwards' ? '+' : ''}</b></button>`).join('');
      $$('.opt', opts).forEach(b => b.addEventListener('click', () => { oi = +b.dataset.i; render(); }));
      qtyBox.hidden = !cat.unit; if (cat.unit) $('span', qtyBox).textContent = cat.unit === 'implant' ? 'Implants' : 'Teeth';
      add.hidden = !cat.addons.length;
      if (cat.addons.length) $('span', add).textContent = `${cat.addons[0][0]} (+${inr(cat.addons[0][1])} each)`;
      total();
    }
    function total() {
      const [n, v, s] = cat.options[oi], extra = (!add.hidden && $('input', add).checked) ? cat.addons[0][1] : 0, q = cat.unit ? qty : 1;
      tot.textContent = inr((v + extra) * q); nEl.textContent = qty;
      on.textContent = s === 'onwards' ? 'onwards' : (s || '');
      note.textContent = cat.note;
      const txt = `Hello, I'd like to book at Noida Dental Care: ${n}${cat.unit ? ' × ' + q : ''}${extra ? ' with post' : ''}. Website estimate: ${inr((v + extra) * q)}${s === 'onwards' ? ' onwards' : ''}.`;
      waBtn.href = `https://wa.me/${D.wa}?text=` + encodeURIComponent(txt);
    }
    $$('[role="tab"]', px).forEach(t => t.addEventListener('click', () => { $$('[role="tab"]', px).forEach(x => x.setAttribute('aria-selected', x === t)); cat = P.find(p => p.id === t.dataset.cat); oi = 0; qty = 1; $('input', add).checked = false; render(); }));
    $$('[data-q]', qtyBox).forEach(b => b.addEventListener('click', () => { qty = Math.max(1, Math.min(32, qty + +b.dataset.q)); total(); }));
    $('input', add).addEventListener('change', total);
    render();
  });

  /* ---------- aftercare tool ---------- */
  $$('[data-care-tool]').forEach(tool => {
    const tabs = $$('[role="tab"]', tool);
    const pick = id => { tabs.forEach(t => t.setAttribute('aria-selected', t.dataset.care === id)); $$('[data-care-panel]', tool).forEach(p => p.hidden = p.dataset.carePanel !== id); };
    tabs.forEach(t => t.addEventListener('click', () => pick(t.dataset.care)));
    const q = new URLSearchParams(location.search).get('p'); if (q && tabs.some(t => t.dataset.care === q)) pick(q);
    $('#careShare')?.addEventListener('click', () => {
      const id = tabs.find(t => t.getAttribute('aria-selected') === 'true').dataset.care, c = (D.care || []).find(x => x.id === id);
      const txt = `${c.name} aftercare (Noida Dental Care)\n\n` + c.groups.map(([h, items]) => `${h}:\n` + items.map(i => '• ' + i).join('\n')).join('\n\n') + '\n\nQuestions? Call 96509 83999';
      window.open('https://wa.me/?text=' + encodeURIComponent(txt), '_blank', 'noopener');
    });
    $('#carePrint')?.addEventListener('click', () => print());
  });

  /* ---------- before / after ---------- */
  $$('[data-ba]').forEach(ba => {
    const r = $('.ba-r', ba), set = p => { p = Math.max(0, Math.min(100, p)); ba.style.setProperty('--pos', p + '%'); r.value = Math.round(p); };
    const fromX = x => { const b = ba.getBoundingClientRect(); set((x - b.left) / b.width * 100); };
    let down = false, sx = 0, sy = 0, dec = false, hz = false;
    ba.addEventListener('pointerdown', e => { down = true; dec = e.pointerType === 'mouse'; hz = dec; sx = e.clientX; sy = e.clientY; if (hz) { ba.setPointerCapture(e.pointerId); fromX(e.clientX); } });
    ba.addEventListener('pointermove', e => { if (!down) return; if (!dec) { const dx = Math.abs(e.clientX - sx), dy = Math.abs(e.clientY - sy); if (dx < 6 && dy < 6) return; dec = true; hz = dx > dy; if (hz) ba.setPointerCapture(e.pointerId); } if (hz) fromX(e.clientX); });
    const end = e => { if (down && !dec && e.type === 'pointerup') fromX(e.clientX); down = false; };
    ba.addEventListener('pointerup', end); ba.addEventListener('pointercancel', end); r.addEventListener('input', () => set(+r.value));
  });

  $$('[data-year]').forEach(n => n.textContent = new Date().getFullYear());
})();
