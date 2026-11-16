/* AXIS template · page motion: smooth scroll, letter reveals, cursor, spotlight cards, timeline, drag carousel. */
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

  /* ---------- smooth scroll (mouse and trackpad only) ---------- */
  let lenis = null;
  if (!RM && window.Lenis && FINE) {
    lenis = new Lenis({ lerp: 0.1 });
    if (G) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
    else { const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const t = a.getAttribute('href').length > 1 && $(a.getAttribute('href')); if (!t) return;
    e.preventDefault(); closeMenu();
    lenis ? lenis.scrollTo(t, { offset: t.id === 'implant' ? 0 : -70, duration: 1.4 }) : t.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
  }));

  /* ---------- nav, menu, demo badge ---------- */
  const nav = $('#nav'), demo = $('.demo'); let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY; nav.classList.toggle('scrolled', y > 30);
    if (demo) { const first = y < innerHeight * 0.7, phone = innerWidth < 641;
      if (first || (phone && y > lastY + 6)) demo.classList.add('tuck'); else if (!phone || y < lastY - 6) demo.classList.remove('tuck'); }
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const menuBtn = $('#menuBtn'), sheet = $('#sheet');
  function closeMenu() { sheet.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); sheet.setAttribute('aria-hidden', 'true'); lenis && lenis.start(); }
  menuBtn.addEventListener('click', () => {
    const open = !sheet.classList.contains('open');
    sheet.classList.toggle('open', open); menuBtn.setAttribute('aria-expanded', String(open)); sheet.setAttribute('aria-hidden', String(!open));
    lenis && (open ? lenis.stop() : lenis.start());
  });

  /* ---------- custom cursor (mouse only) ---------- */
  const cur = $('#cursor');
  if (FINE && !RM && cur) {
    root.classList.add('has-cursor');
    const dot = $('i', cur), ring = $('span', cur); let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
    addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; dot.style.transform = `translate(${x}px,${y}px)`; cur.classList.add('on'); }, { passive: true });
    document.addEventListener('pointerleave', () => cur.classList.remove('on'));
    const loop = () => { rx += (x - rx) * 0.18; ry += (y - ry) * 0.18; ring.style.translate = `${rx}px ${ry}px`; requestAnimationFrame(loop); }; loop();
    dot.style.position = ring.style.position = 'fixed';
    document.addEventListener('pointerover', e => {
      const drag = e.target.closest('#rtrack'), hov = !drag && e.target.closest('a,button,summary,.opt,input,select');
      cur.classList.toggle('drag', !!drag); cur.classList.toggle('hover', !!hov); ring.textContent = drag ? 'DRAG' : '';
    });
  }

  /* ---------- assembly story: chapter text and progress follow scroll ---------- */
  const story = $('#implant'), phases = $$('.phase'), bar = $('#asBar'), label = $('#asLabel');
  const names = ['Anatomy', 'Placement', 'Healing', 'Final crown'];
  let cur2 = 0;
  const storyTick = () => {
    const r = story.getBoundingClientRect(), p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)));
    const ph = p < 0.26 ? 0 : p < 0.52 ? 1 : p < 0.76 ? 2 : 3;
    if (bar) bar.style.transform = `scaleX(${p.toFixed(4)})`;
    if (ph !== cur2) { cur2 = ph; phases.forEach((x, i) => x.classList.toggle('on', i === ph)); label.textContent = `0${ph + 1} / 04 · ${names[ph]}`; }
  };
  addEventListener('scroll', storyTick, { passive: true }); storyTick();

  /* ---------- spotlight cards ---------- */
  $$('.opt').forEach(c => c.addEventListener('pointermove', e => {
    const r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }));

  /* ---------- process: the big "Day 1 / Wk 14" label rolls as each step reaches the middle ---------- */
  const steps = $$('.steps li'), val = $('#whenVal'); let curStep = 0;
  const setWhen = (i, dir) => {
    if (i === curStep) return;
    const old = $('span:not(.up):not(.down)', val) || $('span', val);
    const nu = document.createElement('span'); nu.innerHTML = steps[i].dataset.when; nu.className = dir > 0 ? 'down' : 'up';
    val.appendChild(nu); void nu.offsetWidth;
    nu.className = ''; if (old) { old.className = dir > 0 ? 'up' : 'down'; setTimeout(() => old.remove(), 700); }
    curStep = i;
  };
  const stepTick = () => {
    const mid = innerHeight * 0.55; let idx = 0;
    steps.forEach((s, i) => { if (s.getBoundingClientRect().top < mid) idx = i; });
    steps.forEach((s, i) => s.classList.toggle('on', i === idx));
    if (idx !== curStep) setWhen(idx, idx > curStep ? 1 : -1);
  };
  addEventListener('scroll', stepTick, { passive: true }); stepTick();

  /* ---------- reviews: drag with momentum, plus buttons ---------- */
  const track = $('#rtrack');
  if (track) {
    let x = 0, v = 0, dragging = false, sx = 0, sx0 = 0, lx = 0, lt = 0, moved = false;
    const min = () => Math.min(0, track.parentElement.clientWidth - parseFloat(getComputedStyle(track.parentElement).paddingLeft) - parseFloat(getComputedStyle(track.parentElement).paddingRight) - track.scrollWidth);
    const apply = () => (track.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`);
    track.addEventListener('pointerdown', e => { dragging = true; moved = false; sx = e.clientX; sx0 = x; lx = e.clientX; lt = performance.now(); v = 0; track.classList.add('dragging'); });
    addEventListener('pointermove', e => {
      if (!dragging) return;
      const dx = e.clientX - sx; if (Math.abs(dx) > 4) moved = true;
      let nx = sx0 + dx; const mn = min();
      if (nx > 0) nx *= 0.35; if (nx < mn) nx = mn + (nx - mn) * 0.35;
      const now = performance.now(); v = (e.clientX - lx) / Math.max(1, now - lt) * 16; lx = e.clientX; lt = now;
      x = nx; apply();
    }, { passive: true });
    const release = () => {
      if (!dragging) return; dragging = false; track.classList.remove('dragging');
      const glide = () => { x += v; v *= 0.93; const mn = min(); if (x > 0) { x += (0 - x) * 0.2; v *= 0.5; } if (x < mn) { x += (mn - x) * 0.2; v *= 0.5; } apply(); if (Math.abs(v) > 0.3 || x > 0.5 || x < mn - 0.5) requestAnimationFrame(glide); };
      requestAnimationFrame(glide);
    };
    addEventListener('pointerup', release); addEventListener('pointercancel', release);
    track.addEventListener('click', e => { if (moved) e.preventDefault(); }, true);
    const step = dir => { const w = $('.rcard', track).offsetWidth + 18; const mn = min(); const to = Math.max(mn, Math.min(0, x - dir * w)); if (G && !RM) { const o = { x }; gsap.to(o, { x: to, duration: 0.7, ease: 'power3.out', onUpdate: () => { x = o.x; apply(); } }); } else { x = to; apply(); } };
    $('#rPrev').addEventListener('click', () => step(-1)); $('#rNext').addEventListener('click', () => step(1));
    addEventListener('resize', () => { x = Math.max(min(), Math.min(0, x)); apply(); });
  }

  /* ---------- FAQ: smooth open and close ---------- */
  $$('.qa details').forEach(d => {
    const s = $('summary', d), b = $('.qa-b', d);
    s.addEventListener('click', e => {
      if (RM || !b.animate) return; e.preventDefault();
      if (d.open) { const h = b.offsetHeight; b.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 320, easing: 'ease' }).onfinish = () => (d.open = false); }
      else { d.open = true; const h = b.offsetHeight; b.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' }); }
    });
  });

  /* ---------- booking form (demo) ---------- */
  const toast = $('#toast'); let tt;
  $('#ctaForm').addEventListener('submit', e => {
    e.preventDefault(); e.target.reset();
    toast.textContent = 'Demo template: on your clinic’s site this request goes straight to your WhatsApp.';
    toast.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('show'), 4600);
  });

  /* ---------- counters ---------- */
  const count = el => {
    const to = +el.dataset.count, dec = +(el.dataset.dec || 0), f = n => n.toLocaleString('en-IN', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    if (!ANIM) { el.textContent = f(to); return; }
    const o = { v: 0 }; gsap.to(o, { v: to, duration: 1.8, ease: 'power3.out', onUpdate: () => (el.textContent = f(dec ? o.v : Math.round(o.v))) });
  };
  if (!ANIM) { $$('[data-count]').forEach(count); return; }

  /* ---------- split into letters (words kept whole so lines never break mid-word) ---------- */
  const split = el => {
    const orig = el.innerHTML, out = [];
    const walk = (node, wrapCls) => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) n.textContent.split(/(\s+)/).forEach(w => {
        if (!w) return; if (/^\s+$/.test(w)) { out.push(' '); return; }
        out.push(`<span class="chw${wrapCls ? ' ' + wrapCls : ''}">` + [...w].map(c => `<span class="ch">${c.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]))}</span>`).join('') + '</span>');
      });
      else if (n.nodeType === 1) walk(n, n.className);
    });
    walk(el, '');
    el.innerHTML = out.join('');
    return { chars: $$('.ch', el), restore: () => (el.innerHTML = orig) };
  };

  const ready = document.fonts ? document.fonts.ready : Promise.resolve();
  ready.then(() => {
    // hero
    const tl = gsap.timeline({ delay: 0.15 });
    $$('.hero [data-chars]').forEach((el, i) => {
      const sp = split(el);
      tl.from(sp.chars, { yPercent: 115, rotate: 8, duration: 1.1, ease: 'expo.out', stagger: 0.035, onComplete: sp.restore }, i * 0.25);
    });
    const heroUp = $$('.hero [data-up]');
    tl.to(heroUp, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.1, onComplete: shown(heroUp) }, 0.5)
      .from('.nav', { yPercent: -100, opacity: 0, duration: 0.9, ease: 'power3.out', clearProps: 'transform,opacity' }, 0);

    // section headings: letters rise
    $$('[data-split]').forEach(el => ScrollTrigger.create({ trigger: el, start: 'top 86%', once: true, onEnter: () => {
      const sp = split(el); gsap.from(sp.chars, { yPercent: 110, duration: 0.9, ease: 'expo.out', stagger: 0.018, onComplete: sp.restore });
    } }));
    // blocks
    ScrollTrigger.batch($$('[data-up]').filter(el => !el.closest('.hero')), { start: 'top 90%', once: true, onEnter: els => gsap.to(els, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, onComplete: shown(els) }) });
    $$('[data-count]').forEach(el => ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => count(el) }));
    // bento images drift inside their tiles
    $$('.tile picture img, .opt figure img').forEach(img => gsap.fromTo(img, { scale: 1.18, yPercent: -4 }, { scale: 1.02, yPercent: 4, ease: 'none', scrollTrigger: { trigger: img.closest('.tile,.opt'), start: 'top bottom', end: 'bottom top', scrub: true } }));
    // surgeon glow breathes in
    gsap.from('.sg-img picture', { yPercent: 12, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.surgeon', start: 'top 70%' } });
    // cta rings and footer word
    gsap.to('.cta .ring', { rotate: 40, scale: 1.15, ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from('.word', { yPercent: 35, ease: 'none', scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'bottom bottom', scrub: true } });
    addEventListener('load', () => ScrollTrigger.refresh());
  });
})();
