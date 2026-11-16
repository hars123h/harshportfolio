/* Sage template · one script for all four pages. Each block checks that its markup exists. */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const G = !!(window.gsap && window.ScrollTrigger);
  const ANIM = G && !RM;
  const FINE = matchMedia('(pointer: fine)').matches;
  if (!ANIM) root.classList.remove('anim');
  if (G) gsap.registerPlugin(ScrollTrigger);
  window.__ready = true;
  const shown = els => () => els.forEach(e => { e.classList.add('shown'); e.style.transform = ''; e.style.opacity = ''; });
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- clinic hours (IST, 0 = Sunday) ---------- */
  const HOURS = { 0: [10, 14], 1: [9, 20], 2: [9, 20], 3: [9, 20], 4: [9, 20], 5: [9, 20], 6: [9, 20] };
  const istNow = () => { const n = new Date(); return new Date(n.getTime() + (n.getTimezoneOffset() + 330) * 60000); };
  const fmt = x => { const h = Math.floor(x), m = Math.round((x - h) * 60), ap = h >= 12 ? 'PM' : 'AM'; return ((h + 11) % 12 + 1) + (m ? ':' + String(m).padStart(2, '0') : '') + ' ' + ap; };
  const dayName = (d, k) => k === 0 ? 'Today' : k === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'long' });
  const slot = $('#nextSlot');
  if (slot) {
    const d = istNow();
    for (let k = 0; k < 8; k++) {
      const dd = new Date(d); dd.setDate(d.getDate() + k);
      const [o, c] = HOURS[dd.getDay()];
      const start = k === 0 ? Math.max(o, Math.ceil((d.getHours() + d.getMinutes() / 60 + 1) * 2) / 2) : o;
      if (start <= c - 0.75) { slot.textContent = dayName(dd, k) + ', ' + fmt(start); break; }
    }
  }

  /* ---------- smooth scroll (mouse and trackpad only) ---------- */
  let lenis = null;
  if (!RM && window.Lenis && FINE) {
    lenis = new Lenis({ lerp: 0.1 });
    if (G) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
    else { const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
  }

  /* ---------- header: scrolled state, sliding highlight, mobile sheet ---------- */
  const hdr = $('.hdr'), demo = $('.demo'); let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY;
    hdr.classList.toggle('scrolled', y > 24);
    if (demo) { const first = y < innerHeight * 0.7, phone = innerWidth < 641;
      if (first || (phone && y > lastY + 6)) demo.classList.add('tuck'); else if (!phone || y < lastY - 6) demo.classList.remove('tuck'); }
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const nav = $('.nav'), blob = nav && $('.blob', nav), cur = nav && $('a[aria-current="page"]', nav);
  const moveBlob = a => {
    if (!blob) return;
    if (!a) { blob.style.opacity = 0; return; }
    blob.style.opacity = 1; blob.style.width = a.offsetWidth + 'px'; blob.style.transform = `translateX(${a.offsetLeft}px)`;
    $$('a', nav).forEach(x => x.classList.toggle('lit', x === a));
  };
  if (nav) {
    const reset = () => { moveBlob(cur); $$('a', nav).forEach(x => x.classList.remove('lit')); };
    $$('a', nav).forEach(a => a.addEventListener('mouseenter', () => moveBlob(a)));
    nav.addEventListener('mouseleave', reset);
    reset(); (document.fonts ? document.fonts.ready : Promise.resolve()).then(reset); addEventListener('resize', reset);
  }
  const burger = $('.burger'), sheet = $('.sheet');
  if (burger) burger.addEventListener('click', () => {
    const open = !sheet.classList.contains('open');
    sheet.classList.toggle('open', open); burger.setAttribute('aria-expanded', String(open)); sheet.setAttribute('aria-hidden', String(!open));
    lenis && (open ? lenis.stop() : lenis.start());
  });

  /* ---------- toast ---------- */
  const toast = $('.toast'); let tt;
  const say = m => { toast.textContent = m; toast.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('show'), 4600); };

  /* ---------- hero slot card ---------- */
  $$('.seg button').forEach(b => b.addEventListener('click', () => {
    $$('.seg button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    $('#slotGo').href = 'contact.html?who=' + b.dataset.who;
  }));

  /* ---------- age panels: hover (mouse) or tap to open ---------- */
  const panels = $$('.panel');
  const openPanel = p => panels.forEach(x => { const on = x === p; x.classList.toggle('on', on); x.setAttribute('aria-expanded', String(on)); });
  panels.forEach(p => { p.addEventListener('click', () => openPanel(p)); if (FINE) p.addEventListener('mouseenter', () => openPanel(p)); });

  /* ---------- FAQ: smooth open and close ---------- */
  $$('.qa details').forEach(d => {
    const s = $('summary', d), b = $('.qa-b', d);
    s.addEventListener('click', e => {
      if (RM || !b.animate) return; e.preventDefault();
      if (d.open) { const h = b.offsetHeight; b.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 320, easing: 'ease' }).onfinish = () => (d.open = false); }
      else { d.open = true; const h = b.offsetHeight; b.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 440, easing: 'cubic-bezier(.2,.8,.2,1)' }); }
    });
  });

  /* ---------- services: the sticky picture follows the item in the middle of the screen ---------- */
  const items = $$('.svc-item'), figs = $$('.svc-media figure'), cap = $('#svcCap');
  if (items.length) {
    let active = 0;
    const set = i => {
      if (i === active) return;
      figs.forEach((f, k) => { f.classList.remove('was'); f.style.zIndex = k === i ? 2 : k === active ? 1 : 0; });
      figs[active].classList.add('was'); figs[active].classList.remove('on');
      figs[i].classList.add('on');
      items.forEach((it, k) => it.classList.toggle('on', k === i));
      if (cap) cap.innerHTML = $('h2', items[i]).innerHTML;
      active = i;
    };
    const tick = () => { const mid = innerHeight * 0.5; let best = 0, bd = 1e9; items.forEach((it, k) => { const r = it.getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - mid); if (d < bd) { bd = d; best = k; } }); set(best); };
    addEventListener('scroll', tick, { passive: true }); tick();
  }

  /* ---------- plans: monthly / yearly ---------- */
  const tog = $('.toggle');
  if (tog) {
    const amts = $$('.amt'), pers = $$('[data-per]'); let yearly = false;
    const fmtR = n => '₹' + Math.round(n).toLocaleString('en-IN');
    $$('button', tog).forEach(b => b.addEventListener('click', () => {
      const y = b.dataset.bill === 'y'; if (y === yearly) return; yearly = y;
      $$('button', tog).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      tog.classList.toggle('yr', y);
      pers.forEach(p => (p.textContent = y ? '/ year' : '/ month'));
      amts.forEach(a => {
        const from = +(y ? a.dataset.m : a.dataset.y), to = +(y ? a.dataset.y : a.dataset.m);
        if (!ANIM) { a.textContent = fmtR(to); return; }
        const o = { v: from }; gsap.to(o, { v: to, duration: 0.8, ease: 'power3.out', onUpdate: () => (a.textContent = fmtR(o.v)) });
      });
    }));
  }

  /* ---------- contact: who, what, when ---------- */
  const bk = $('#bk');
  if (bk) {
    const st = { adults: 1, kids: 0, reasons: new Set(['Check-up']), day: null, tod: 'Evening' };
    const steppers = $$('.stepper', bk);
    const drawSteppers = () => steppers.forEach(s => {
      const k = s.dataset.k, v = st[k], [minus, plus] = $$('button', s);
      $('output', s).textContent = v;
      minus.disabled = v <= 0 || st.adults + st.kids <= 1; plus.disabled = v >= 6;
    });
    steppers.forEach(s => $$('button', s).forEach(b => b.addEventListener('click', () => { const k = s.dataset.k; st[k] = Math.max(0, Math.min(6, st[k] + +b.dataset.d)); drawSteppers(); summary(); })));
    const reasons = $$('#reasons .pill');
    reasons.forEach(b => b.addEventListener('click', () => {
      const r = b.dataset.r;
      if (st.reasons.has(r) && st.reasons.size > 1) st.reasons.delete(r); else st.reasons.add(r);
      reasons.forEach(x => x.setAttribute('aria-pressed', String(st.reasons.has(x.dataset.r)))); summary();
    }));
    const tods = $$('#tod .pill');
    tods.forEach(b => b.addEventListener('click', () => { st.tod = b.dataset.t; tods.forEach(x => x.setAttribute('aria-pressed', String(x === b))); summary(); }));
    const daysEl = $('#days'), now = istNow(), nowH = now.getHours() + now.getMinutes() / 60, days = [];
    for (let k = 0; k < 9 && days.length < 7; k++) {
      const d = new Date(now); d.setDate(now.getDate() + k);
      if (k === 0 && nowH > HOURS[d.getDay()][1] - 1.5) continue;
      days.push({ d, label: k === 0 ? 'Today' : k === 1 ? 'Tmrw' : d.toLocaleDateString('en-IN', { weekday: 'short' }), long: dayName(d, k) });
    }
    daysEl.innerHTML = days.map((x, j) => `<button type="button" class="day" data-i="${j}" aria-pressed="${j === 0}">${x.label}<b>${x.d.getDate()}</b></button>`).join('');
    st.day = days[0].long;
    $$('.day', daysEl).forEach(b => b.addEventListener('click', () => { st.day = days[+b.dataset.i].long; $$('.day', daysEl).forEach(x => x.setAttribute('aria-pressed', String(x === b))); summary(); }));
    function summary() {
      const ppl = [st.adults && `${st.adults} adult${st.adults > 1 ? 's' : ''}`, st.kids && `${st.kids} child${st.kids > 1 ? 'ren' : ''}`].filter(Boolean).join(', ');
      $('#sum').textContent = `${ppl} · ${[...st.reasons].join(', ')} · ${st.day}, ${st.tod.toLowerCase()}`;
    }
    // pre-fill from links on other pages
    const q = new URLSearchParams(location.search), pick = r => { st.reasons = new Set([r]); reasons.forEach(x => x.setAttribute('aria-pressed', String(x.dataset.r === r))); };
    const who = q.get('who'), f = q.get('for'), p = q.get('plan');
    if (who === 'child') { st.adults = 1; st.kids = 1; pick('Kids'); }
    if (who === 'family') { st.adults = 2; st.kids = 2; }
    if (f) { const m = reasons.find(x => x.dataset.r.toLowerCase().startsWith(f.toLowerCase().slice(0, 4))); if (m) pick(m.dataset.r); }
    if (p) { pick('Family plan'); if (p === 'family') { st.adults = 2; st.kids = 2; } if (p === 'grand') { st.adults = 4; st.kids = 2; } }
    drawSteppers(); summary();
    bk.addEventListener('submit', e => {
      e.preventDefault();
      const nm = $('#nm'), ph = $('#ph');
      if (nm.value.trim().length < 2) { nm.focus(); say('Please add your name so we know who to expect.'); return; }
      if (!/^[6-9]\d{9}$/.test(ph.value.replace(/\D/g, '').slice(-10))) { ph.focus(); say('Please add a 10-digit mobile number so we can confirm on WhatsApp.'); return; }
      say('Demo template: on your clinic’s site this request reaches you on WhatsApp instantly.');
      nm.value = ''; ph.value = '';
    });
  }

  /* ---------- counters ---------- */
  const count = el => {
    const to = +el.dataset.count, suf = el.dataset.suffix || '', f = n => Math.round(n).toLocaleString('en-IN') + suf;
    if (!ANIM) { el.textContent = f(to); return; }
    const o = { v: 0 }; gsap.to(o, { v: to, duration: 1.8, ease: 'power3.out', onUpdate: () => (el.textContent = f(o.v)) });
  };

  /* ---------- statement: split into words ---------- */
  const stmt = $('[data-words]');
  if (stmt) {
    const walk = (node, hl) => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(w => { if (!w) return; if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); return; }
          const s = document.createElement('span'); s.className = 'w' + (hl ? ' hl' : ''); s.textContent = w; frag.appendChild(s); });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) { const isHl = n.classList.contains('hl'); walk(n, hl || isHl); if (isHl) n.replaceWith(...n.childNodes); }
    });
    walk(stmt, false);
  }
  const win = $('.window'), winImg = win && $('.window-img', win), winCopy = win && $('.window-copy', win);

  if (!ANIM) {
    $$('[data-count]').forEach(count);
    $$('.statement .w').forEach(w => (w.style.opacity = 1));
    if (win && !RM) { win.style.height = 'auto'; $('.window-pin', win).style.position = 'relative'; $('.window-pin', win).style.padding = '110px 0'; winImg.style.clipPath = 'none'; winImg.style.setProperty('--o', .5); winCopy.style.opacity = 1; winCopy.style.transform = 'none'; }
    return;
  }

  /* ---------- split headings into lines (restored afterwards) ---------- */
  function splitLines(el) {
    const orig = el.innerHTML, words = [];
    const walk = (node, cls) => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) n.textContent.split(/\s+/).filter(Boolean).forEach(w => words.push({ w, cls }));
      else if (n.nodeType === 1) n.tagName === 'BR' ? words.push({ br: 1 }) : walk(n, n.tagName === 'EM' ? 'em' : cls);
    });
    walk(el, '');
    el.innerHTML = words.map(o => (o.br ? '<br>' : o.cls === 'em' ? `<em class="wd">${esc(o.w)}</em>` : `<span class="wd">${esc(o.w)}</span>`)).join(' ');
    const lines = []; let line = [], top = null;
    $$('.wd', el).forEach(s => { if (top !== null && Math.abs(s.offsetTop - top) > 4) { lines.push(line); line = []; } line.push(s.outerHTML); top = s.offsetTop; });
    if (line.length) lines.push(line);
    el.innerHTML = lines.map(l => `<span class="ln"><span class="ln-in">${l.join(' ')}</span></span>`).join('');
    return { inner: $$('.ln-in', el), restore: () => (el.innerHTML = orig) };
  }

  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    // hero (home) or page hero
    const hero = $('.hero') || $('.phero');
    if (hero) {
      const tl = gsap.timeline({ delay: 0.1 }), h1 = $('h1[data-lines]', hero), sp = h1 && splitLines(h1), ups = $$('[data-up]', hero);
      if (sp) tl.from(sp.inner, { yPercent: 110, duration: 1.1, ease: 'power4.out', stagger: 0.1, onComplete: sp.restore }, 0.05);
      tl.to(ups, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.09, onComplete: shown(ups) }, 0.3);
      if ($('.arch', hero)) {
        tl.from('.arch', { clipPath: 'inset(100% 0 0 0 round 999px 999px 40px 40px)', duration: 1.4, ease: 'expo.inOut' }, 0.15)
          .from('.arch img', { scale: 1.3, duration: 1.8, ease: 'expo.out' }, 0.3)
          .from('.slotcard', { y: 40, opacity: 0, duration: 0.9, ease: 'back.out(1.6)' }, 0.9)
          .from('.stamp', { scale: 0.4, opacity: 0, rotate: -90, duration: 1, ease: 'back.out(1.6)' }, 1);
        gsap.to('.arch img', { yPercent: 8, scale: 1.08, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
      }
    }
    // headings and blocks below the fold
    $$('[data-lines]').filter(el => !el.closest('.hero,.phero')).forEach(el => ScrollTrigger.create({ trigger: el, start: 'top 86%', once: true, onEnter: () => {
      const sp = splitLines(el); gsap.from(sp.inner, { yPercent: 110, duration: 1, ease: 'power4.out', stagger: 0.1, onComplete: sp.restore });
    } }));
    ScrollTrigger.batch($$('[data-up]').filter(el => !el.closest('.hero,.phero')), { start: 'top 90%', once: true, onEnter: els => gsap.to(els, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, onComplete: shown(els) }) });
    $$('[data-count]').forEach(el => ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => count(el) }));

    // statement words light up with scroll
    const words = $$('.statement .w');
    if (words.length) ScrollTrigger.create({ trigger: '.statement', start: 'top 82%', end: 'bottom 50%', scrub: true,
      onUpdate: s => { const n = Math.round(s.progress * words.length); words.forEach((w, i) => (w.style.opacity = i < n ? 1 : 0.16)); } });

    // expanding window photo
    if (win) {
      const mob = innerWidth < 641;
      const tl = gsap.timeline({ scrollTrigger: { trigger: win, start: 'top top', end: 'bottom bottom', scrub: 0.6 } });
      tl.fromTo(winImg, { clipPath: mob ? 'inset(14% 6% 14% 6% round 30px)' : 'inset(18% 24% 18% 24% round 44px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', duration: 1 }, 0)
        .fromTo($('img', winImg), { scale: 1.2 }, { scale: 1, ease: 'none', duration: 1 }, 0)
        .to(winImg, { '--o': 1, ease: 'none', duration: 0.5 }, 0.45)
        .to(winCopy, { opacity: 1, y: 0, ease: 'power2.out', duration: 0.4 }, 0.55);
      ScrollTrigger.create({ trigger: win, start: '55% bottom', once: true, onEnter: () => $$('[data-count]', win).forEach(count) });
    }
    // photos ease inside their frames
    $$('.doc-img .frame img, .famband figure img, .svc-media img').forEach(img => gsap.fromTo(img, { scale: 1.12 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: img.closest('figure,.frame,.svc-media'), start: 'top bottom', end: 'bottom top', scrub: true } }));
    gsap.from('.bigword', { yPercent: 40, ease: 'none', scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'bottom bottom', scrub: true } });
    addEventListener('load', () => ScrollTrigger.refresh());
  });
})();
