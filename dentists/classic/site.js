/* Muskaan template · one script for all five pages. Every block checks that its markup exists first. */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const G = !!(window.gsap && window.ScrollTrigger);
  const ANIM = G && !RM;
  if (!ANIM) root.classList.remove('anim');
  if (G) gsap.registerPlugin(ScrollTrigger);
  window.__ready = true;
  const done = els => () => els.forEach(e => { e.classList.add('shown'); e.style.transform = ''; e.style.opacity = ''; });
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- clinic hours in IST (0 = Sunday) ---------- */
  const HOURS = { 0: [10, 14], 1: [10, 20], 2: [10, 20], 3: [10, 20], 4: [10, 20], 5: [10, 20], 6: [10, 20] };
  const istNow = () => { const n = new Date(); return new Date(n.getTime() + (n.getTimezoneOffset() + 330) * 60000); };
  const fmt = x => { const h = Math.floor(x), m = Math.round((x - h) * 60), ap = h >= 12 ? 'PM' : 'AM'; return ((h + 11) % 12 + 1) + (m ? ':' + String(m).padStart(2, '0') : '') + ' ' + ap; };
  function status() {
    const d = istNow(), [o, c] = HOURS[d.getDay()], h = d.getHours() + d.getMinutes() / 60, open = h >= o && h < c;
    const text = open ? 'Open now · closes ' + fmt(c) : h < o ? 'Opens today at ' + fmt(o) : 'Opens tomorrow at ' + fmt(HOURS[(d.getDay() + 1) % 7][0]);
    $$('[data-status]').forEach(el => { el.classList.toggle('is-open', open); const t = $('span', el); if (t) t.textContent = text; });
    const today = $('.hours tr[data-day="' + d.getDay() + '"]'); if (today) today.classList.add('today');
  }
  status(); setInterval(status, 60000);
  const slot = $('#nextSlot');
  if (slot) {
    const d = istNow();
    for (let k = 0; k < 8; k++) {
      const dd = new Date(d); dd.setDate(d.getDate() + k);
      const [o, c] = HOURS[dd.getDay()];
      const start = k === 0 ? Math.max(o, Math.ceil((d.getHours() + d.getMinutes() / 60 + 1) * 2) / 2) : o;
      if (start <= c - 0.5) { slot.textContent = (k === 0 ? 'Today' : k === 1 ? 'Tomorrow' : dd.toLocaleDateString('en-IN', { weekday: 'long' })) + ', ' + fmt(start); break; }
    }
  }

  /* ---------- page curtain ---------- */
  const cur = $('.curtain');
  if (cur) {
    if (RM) cur.remove();
    else {
      cur.style.animation = 'none';
      requestAnimationFrame(() => requestAnimationFrame(() => cur.classList.add('out')));
      document.addEventListener('click', e => {
        const a = e.target.closest('a'); if (!a) return;
        const href = a.getAttribute('href') || '';
        if (a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || /^(https?:|tel:|mailto:|#)/.test(href) || !/\.html/.test(href)) return;
        if (a.pathname === location.pathname && a.hash) return;
        e.preventDefault();
        cur.style.transition = 'none'; cur.classList.remove('out'); cur.style.transform = 'translateY(101%)';
        void cur.offsetHeight;
        cur.style.transition = ''; cur.style.transform = 'translateY(0)';
        setTimeout(() => (location.href = a.href), 560);
      });
      addEventListener('pageshow', e => { if (e.persisted) { cur.style.transform = ''; cur.classList.add('out'); } });
    }
  }

  /* ---------- smooth scroll (mouse and trackpad only) ---------- */
  let lenis = null;
  if (!RM && window.Lenis && !matchMedia('(pointer: coarse)').matches) {
    lenis = new Lenis({ lerp: 0.1 });
    if (G) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
    else { const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const t = a.getAttribute('href').length > 1 && $(a.getAttribute('href')); if (!t) return;
    e.preventDefault(); lenis ? lenis.scrollTo(t, { offset: -90 }) : t.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
  }));

  /* ---------- header ---------- */
  const hdr = $('.hdr');
  const demo = $('.demo'); let lastY = scrollY;
  const onScroll = () => {
    hdr && hdr.classList.toggle('scrolled', scrollY > 20);
    // demo badge tucks away while reading down, comes back on scroll up
    if (demo) { const y = scrollY; const first = y < innerHeight * 0.7, phone = innerWidth < 641;
      if (first || (phone && y > lastY + 6)) demo.classList.add('tuck'); else if (!phone || y < lastY - 6) demo.classList.remove('tuck'); lastY = y; }
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const burger = $('.burger'), mnav = $('.mnav');
  if (burger && mnav) burger.addEventListener('click', () => {
    const open = !mnav.classList.contains('open');
    mnav.classList.toggle('open', open); burger.setAttribute('aria-expanded', String(open)); mnav.setAttribute('aria-hidden', String(!open));
    lenis && (open ? lenis.stop() : lenis.start());
  });

  /* ---------- toast + demo forms ---------- */
  const toast = $('.toast'); let tt;
  const say = m => { if (!toast) return; toast.textContent = m; toast.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('show'), 4600); };
  $$('form[data-demo]').forEach(f => f.addEventListener('submit', e => { e.preventDefault(); say('Demo template: on your clinic’s site this request goes straight to your WhatsApp.'); f.reset(); }));

  /* ---------- FAQ: smooth open and close ---------- */
  $$('.qa details').forEach(d => {
    const s = $('summary', d), b = $('.qa-b', d);
    s.addEventListener('click', e => {
      if (RM || !b.animate) return;
      e.preventDefault();
      if (d.open) { const h = b.offsetHeight; b.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 320, easing: 'ease' }).onfinish = () => (d.open = false); }
      else { d.open = true; const h = b.offsetHeight; b.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' }); }
    });
  });

  /* ---------- testimonials slider ---------- */
  const sl = $('.slider');
  if (sl) {
    const slides = $$('.slide', sl), n = slides.length, bar = $('.sbar i', sl), cnt = $('.scount');
    let i = 0, timer;
    const restart = () => { clearInterval(timer); if (!RM) timer = setInterval(() => go(i + 1), 6500); };
    const go = k => {
      i = (k + n) % n;
      slides.forEach((s, j) => s.classList.toggle('on', j === i));
      if (cnt) cnt.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(n).padStart(2, '0');
      bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = '';
      restart();
    };
    $('.rprev') && $('.rprev').addEventListener('click', () => go(i - 1));
    $('.rnext') && $('.rnext').addEventListener('click', () => go(i + 1));
    sl.addEventListener('mouseenter', () => { clearInterval(timer); sl.classList.add('paused'); });
    sl.addEventListener('mouseleave', () => { sl.classList.remove('paused'); go(i); });
    let x0 = null;
    sl.addEventListener('pointerdown', e => (x0 = e.clientX));
    sl.addEventListener('pointerup', e => { if (x0 !== null && Math.abs(e.clientX - x0) > 50) go(i + (e.clientX < x0 ? 1 : -1)); x0 = null; });
    go(0);
  }

  /* ---------- treatments filter ---------- */
  const chips = $$('.chip[data-f]'), tcards = $$('.tcard');
  if (chips.length) {
    chips.forEach(c => { const f = c.dataset.f, k = f === 'all' ? tcards.length : tcards.filter(t => t.dataset.cat === f).length; $('small', c).textContent = k; });
    chips.forEach(c => c.addEventListener('click', () => {
      const f = c.dataset.f;
      chips.forEach(x => x.setAttribute('aria-pressed', String(x === c)));
      tcards.forEach(t => t.classList.toggle('hide', !(f === 'all' || t.dataset.cat === f)));
      if (ANIM) gsap.fromTo(tcards.filter(t => !t.classList.contains('hide')), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.55, stagger: 0.05, ease: 'power3.out', clearProps: 'transform' });
      G && ScrollTrigger.refresh();
    }));
  }

  /* ---------- gallery lightbox ---------- */
  const lb = $('.lb'), gb = $$('.gal button');
  if (lb && gb.length) {
    const img = $('img', lb), cap = $('figcaption', lb); let gi = 0;
    const show = k => { gi = (k + gb.length) % gb.length; const s = $('img', gb[gi]); img.src = s.currentSrc || s.src; img.alt = s.alt; cap.textContent = s.alt; };
    const close = () => { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); lenis && lenis.start(); };
    gb.forEach((b, k) => b.addEventListener('click', () => { show(k); lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); lenis && lenis.stop(); $('.x', lb).focus(); }));
    $('.x', lb).addEventListener('click', close);
    $('.pv', lb).addEventListener('click', () => show(gi - 1));
    $('.nx', lb).addEventListener('click', () => show(gi + 1));
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    addEventListener('keydown', e => { if (!lb.classList.contains('open')) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') show(gi - 1); if (e.key === 'ArrowRight') show(gi + 1); });
  }

  /* ---------- booking: four steps ---------- */
  const bk = $('#booking');
  if (bk) {
    const st = { treatment: null, doctor: 'Any available doctor', day: null, time: null };
    const panes = $$('.pane', bk), bars = $$('.bk-steps span', bk), next = $('.next', bk), back = $('.back', bk), nav = $('.bk-nav', bk);
    let step = 0;
    const valid = () => step === 0 ? !!st.treatment : step === 1 ? !!st.doctor : step === 2 ? !!st.time
      : ($('#bkName').value.trim().length > 1 && /^[6-9]\d{9}$/.test($('#bkPhone').value.replace(/\D/g, '').slice(-10)));
    const check = () => (next.disabled = !valid());
    const show = k => {
      step = k;
      panes.forEach((p, j) => p.classList.toggle('on', j === k));
      bars.forEach((b, j) => b.classList.toggle('on', j <= Math.min(k, 3)));
      back.classList.toggle('show', k > 0 && k < 4);
      nav.hidden = k === 4;
      next.firstChild.textContent = k === 3 ? 'Confirm appointment ' : 'Continue ';
      if (k === 3) $('.summary', bk).innerHTML = [['Treatment', st.treatment], ['Doctor', st.doctor], ['When', st.day + ', ' + st.time]].map(r => `<span>${r[0]}<b>${esc(r[1])}</b></span>`).join('');
      check();
      const r = bk.getBoundingClientRect(); if (r.top < 70) (lenis ? lenis.scrollTo(bk, { offset: -100 }) : bk.scrollIntoView({ behavior: 'smooth' }));
    };
    $$('[data-group]', bk).forEach(b => b.addEventListener('click', () => {
      const g = b.dataset.group;
      $$(`[data-group="${g}"]`, bk).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      st[g] = b.dataset.val; check();
    }));
    // days and times
    const daysEl = $('.days', bk), timesEl = $('.times', bk), hint = $('.hint', bk);
    const now = istNow(), nowH = now.getHours() + now.getMinutes() / 60;
    const days = [];
    for (let k = 0; k < 8 && days.length < 7; k++) {
      const d = new Date(now); d.setDate(now.getDate() + k);
      const [o, c] = HOURS[d.getDay()];
      if (k === 0 && nowH + 1 > c - 0.5) continue;
      days.push({ d, k, o, c, label: k === 0 ? 'Today' : k === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short' }) });
    }
    daysEl.innerHTML = days.map((x, j) => `<button type="button" class="day" data-i="${j}" aria-pressed="false">${x.label}<b>${x.d.getDate()}</b></button>`).join('');
    const buildTimes = j => {
      const x = days[j], out = [];
      for (let t = x.o; t <= x.c - 0.5; t += 0.5) {
        const past = x.k === 0 && t < nowH + 1, taken = ((x.d.getDate() * 7 + t * 4) % 5) === 0;
        out.push(`<button type="button" class="time" data-t="${t}" ${past || taken ? 'disabled' : ''} aria-pressed="false">${fmt(t)}</button>`);
      }
      timesEl.innerHTML = out.join('');
      hint.textContent = x.d.getDay() === 0 ? 'Sundays: 10 AM to 2 PM. Crossed-out times are already booked.' : 'Crossed-out times are already booked.';
      $$('.time', timesEl).forEach(b => b.addEventListener('click', () => {
        $$('.time', timesEl).forEach(z => z.setAttribute('aria-pressed', String(z === b)));
        st.time = fmt(+b.dataset.t); check();
      }));
    };
    $$('.day', daysEl).forEach(b => b.addEventListener('click', () => {
      $$('.day', daysEl).forEach(z => z.setAttribute('aria-pressed', String(z === b)));
      const x = days[+b.dataset.i]; st.day = x.label === 'Today' || x.label === 'Tomorrow' ? x.label : x.d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
      st.time = null; buildTimes(+b.dataset.i); check();
    }));
    if (days.length) $('.day', daysEl).click();
    $$('#bkName,#bkPhone', bk).forEach(i => i.addEventListener('input', check));
    next.addEventListener('click', () => {
      if (!valid()) return;
      if (step < 3) return show(step + 1);
      show(4);
      say('Demo template: on your clinic’s site this booking reaches you on WhatsApp instantly.');
    });
    back.addEventListener('click', () => show(Math.max(0, step - 1)));
    // pre-fill from links like contact.html?treatment=Implant&doctor=arjun
    const q = new URLSearchParams(location.search);
    const want = (q.get('treatment') || '').toLowerCase();
    if (want) { const m = $$('[data-group="treatment"]', bk).find(b => b.dataset.val.toLowerCase().includes(want) || want.includes(b.dataset.key || '~')); m && m.click(); }
    const doc = (q.get('doctor') || '').toLowerCase();
    if (doc) { const m = $$('[data-group="doctor"]', bk).find(b => b.dataset.id === doc); m && m.click(); }
    show(0);
  }

  /* ---------- counters ---------- */
  const count = el => {
    const to = +el.dataset.count, suf = el.dataset.suffix || '', loc = n => n.toLocaleString('en-IN');
    if (!ANIM) { el.textContent = loc(to) + suf; return; }
    const o = { v: 0 }; gsap.to(o, { v: to, duration: 1.6, ease: 'power2.out', onUpdate: () => (el.textContent = loc(Math.round(o.v)) + suf) });
  };

  if (!ANIM) {
    $$('[data-count]').forEach(count);
    $$('.step,.tl-item').forEach(s => s.classList.add('on'));
    $$('.steps-line i,.tl-line i').forEach(i => (i.style.transform = 'none'));
    return;
  }

  /* ---------- split headings into lines (restored to plain text afterwards) ---------- */
  function splitLines(el) {
    const orig = el.innerHTML, words = [];
    const walk = (node, cls) => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) n.textContent.split(/\s+/).filter(Boolean).forEach(w => words.push({ w, cls }));
      else if (n.nodeType === 1) n.tagName === 'BR' ? words.push({ br: 1 }) : walk(n, (cls + ' ' + n.className).trim());
    });
    walk(el, '');
    el.innerHTML = words.map(o => (o.br ? '<br>' : `<span class="wd ${o.cls}">${esc(o.w)}</span>`)).join(' ');
    const lines = []; let line = [], top = null;
    $$('.wd', el).forEach(s => { if (top !== null && Math.abs(s.offsetTop - top) > 4) { lines.push(line); line = []; } line.push(s.outerHTML); top = s.offsetTop; });
    if (line.length) lines.push(line);
    el.innerHTML = lines.map(l => `<span class="ln"><span class="ln-in">${l.join(' ')}</span></span>`).join('');
    return { inner: $$('.ln-in', el), restore: () => (el.innerHTML = orig) };
  }

  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  fontsReady.then(() => {
    /* hero entrance (home) */
    const hero = $('.hero');
    if (hero) {
      const tl = gsap.timeline({ delay: cur ? 0.45 : 0.1 });
      const h1 = $('h1[data-lines]', hero), sp = h1 && splitLines(h1);
      tl.from('.blob', { scale: 0.55, opacity: 0, duration: 1.2, ease: 'expo.out' }, 0)
        .from('.ring', { opacity: 0, duration: 1.4 }, 0.2)
        .from('.hero-art .doc', { y: 90, opacity: 0, duration: 1.2, ease: 'expo.out' }, 0.15);
      if (sp) tl.from(sp.inner, { yPercent: 108, duration: 1, ease: 'power4.out', stagger: 0.1, onComplete: sp.restore }, 0.1);
      tl.to($$('[data-up]', hero), { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, onComplete: done($$('[data-up]', hero)) }, 0.4)
        .from('.float', { scale: 0.6, opacity: 0, y: 24, duration: 0.8, ease: 'back.out(1.8)', stagger: 0.12 }, 0.7);
      // floating cards drift with the pointer, the doctor drifts the other way
      if (matchMedia('(pointer: fine)').matches) {
        const fx = gsap.quickTo('.floats', 'x', { duration: 0.8, ease: 'power3' }), fy = gsap.quickTo('.floats', 'y', { duration: 0.8, ease: 'power3' });
        const dx = gsap.quickTo('.hero-art .doc', 'xPercent', { duration: 1, ease: 'power3' });
        hero.addEventListener('pointermove', e => { const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5; fx(x * 26); fy(y * 18); dx(-50 - x * 3); });
      }
      gsap.to('.hero-art', { yPercent: 8, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    }
    /* inner page hero */
    const ph = $('.phero');
    if (ph) {
      const h1 = $('h1[data-lines]', ph), sp = h1 && splitLines(h1), tl = gsap.timeline({ delay: cur ? 0.45 : 0.1 });
      if (sp) tl.from(sp.inner, { yPercent: 108, duration: 1, ease: 'power4.out', stagger: 0.1, onComplete: sp.restore }, 0);
      tl.to($$('[data-up]', ph), { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, onComplete: done($$('[data-up]', ph)) }, 0.3)
        .from('.phero .deco', { rotate: -25, scale: 0.7, opacity: 0, duration: 1.4, ease: 'expo.out' }, 0);
      gsap.to('.phero .deco', { rotate: 30, ease: 'none', scrollTrigger: { trigger: ph, start: 'top top', end: 'bottom top', scrub: true } });
    }

    /* headings and blocks below the fold */
    $$('[data-lines]').filter(el => !el.closest('.hero,.phero')).forEach(el => {
      ScrollTrigger.create({ trigger: el, start: 'top 86%', once: true, onEnter: () => { const sp = splitLines(el); gsap.from(sp.inner, { yPercent: 108, duration: 1, ease: 'power4.out', stagger: 0.1, onComplete: sp.restore }); } });
    });
    ScrollTrigger.batch($$('[data-up]').filter(el => !el.closest('.hero,.phero')), { start: 'top 90%', once: true, onEnter: els => gsap.to(els, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, onComplete: done(els) }) });
    $$('[data-count]').forEach(el => ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => count(el) }));
    $$('[data-zoom] img').forEach(img => gsap.fromTo(img, { scale: 1.16 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true } }));

    /* marquee: speeds up and flips direction with scroll */
    const mq = $('.mq-track');
    if (mq) {
      mq.style.animation = 'none';
      const tw = gsap.to(mq, { xPercent: -50, duration: 34, ease: 'none', repeat: -1 });
      let dir = 1;
      ScrollTrigger.create({ onUpdate: s => { const v = s.getVelocity(); if (Math.abs(v) > 30) dir = v > 0 ? 1 : -1; gsap.to(tw, { timeScale: dir * (1 + Math.min(5, Math.abs(v) / 350)), duration: 0.25, overwrite: true, onComplete: () => gsap.to(tw, { timeScale: dir, duration: 0.9 }) }); } });
    }

    /* stacking treatment cards: each card shrinks and dims as the next one slides over it */
    gsap.matchMedia().add('(min-width: 901px)', () => {
      const cards = $$('.scard');
      cards.forEach((c, i) => {
        if (i === cards.length - 1) return;
        gsap.to(c, { scale: 0.9 + i * 0.015, '--dim': 0.1, ease: 'none', scrollTrigger: { trigger: cards[i + 1], start: 'top bottom', end: 'top ' + (96 + (i + 1) * 16) + 'px', scrub: true } });
      });
    });

    /* collage photos open like a shutter */
    $$('.collage figure').forEach((f, i) => gsap.from(f, { clipPath: 'inset(0 0 100% 0 round 28px)', duration: 1.3, ease: 'expo.inOut', delay: i * 0.15, scrollTrigger: { trigger: '.collage', start: 'top 80%' } }));

    /* first-visit line and step dots */
    const steps = $('.steps');
    if (steps) {
      const items = $$('.step', steps), vertical = () => innerWidth <= 900;
      ScrollTrigger.create({
        trigger: steps, start: 'top 75%', end: 'bottom 55%', scrub: true,
        onUpdate: s => {
          const p = s.progress, i = $('.steps-line i', steps);
          i.style.transform = vertical() ? `scaleY(${p})` : `scaleX(${p})`;
          items.forEach((it, k) => it.classList.toggle('on', p >= k / (items.length - 1) - 0.02));
        }
      });
    }
    /* about: timeline fill */
    const tl2 = $('.tl');
    if (tl2) {
      const items = $$('.tl-item', tl2);
      ScrollTrigger.create({
        trigger: tl2, start: 'top 70%', end: 'bottom 60%', scrub: true,
        onUpdate: s => { $('.tl-line i', tl2).style.transform = `scaleY(${s.progress})`; items.forEach((it, k) => it.classList.toggle('on', s.progress >= k / (items.length - 1) - 0.02)); }
      });
    }
    addEventListener('load', () => ScrollTrigger.refresh());
  });
})();
