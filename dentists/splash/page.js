/* GLEAM template · page behaviour: header, hero motion, cursor-follow treatments, odometer, stories, tilt card, chat booking. */
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

  /* ---------- smooth scroll (mouse and trackpad) ---------- */
  let lenis = null;
  if (!RM && window.Lenis && FINE) {
    lenis = new Lenis({ lerp: 0.1 });
    if (G) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
    else { const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'), t = id.length > 1 && $(id); if (!t) return;
    e.preventDefault(); closeMenu(); lenis ? lenis.scrollTo(t, { offset: -70 }) : t.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
  }));

  /* ---------- header, menu, demo badge ---------- */
  const hdr = $('#hdr'), demo = $('.demo'); let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY; hdr.classList.toggle('scrolled', y > 40);
    if (demo) { const first = y < innerHeight * 0.7, phone = innerWidth < 641;
      if (first || (phone && y > lastY + 6)) demo.classList.add('tuck'); else if (!phone || y < lastY - 6) demo.classList.remove('tuck'); }
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const menuBtn = $('#menuBtn'), sheet = $('#sheet');
  function closeMenu() { sheet.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); sheet.setAttribute('aria-hidden', 'true'); lenis && lenis.start(); }
  menuBtn.addEventListener('click', () => { const open = !sheet.classList.contains('open'); sheet.classList.toggle('open', open); menuBtn.setAttribute('aria-expanded', String(open)); sheet.setAttribute('aria-hidden', String(!open)); lenis && (open ? lenis.stop() : lenis.start()); });

  /* ---------- toast ---------- */
  const toast = $('#toast'); let tt;
  const say = m => { toast.textContent = m; toast.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('show'), 4600); };

  /* ---------- hero: sparkles sit around the tooth; the hint hides after the first drag ---------- */
  const hole = $('#hole'), hero = $('#hero'), sparks = $$('.spark'), hint = $('#hint');
  if (!FINE) hint.textContent = 'Swipe the tooth to spin it';
  window.GLEAM = { dragged: () => { if (ANIM) gsap.to(hint, { opacity: 0, duration: 0.4 }); else hint.style.opacity = 0; } };
  const placeSparks = () => {
    const h = hero.getBoundingClientRect(), b = hole.getBoundingClientRect();
    const pts = [[b.right + b.width * 0.05, b.top - b.height * 0.25], [b.left - b.width * 0.15, b.bottom - b.height * 0.05], [b.left + b.width * 0.05, b.top - b.height * 0.35]];
    sparks.forEach((s, i) => { s.style.left = (pts[i][0] - h.left - 10) + 'px'; s.style.top = (pts[i][1] - h.top - 10) + 'px'; });
  };
  placeSparks(); addEventListener('resize', placeSparks); (document.fonts ? document.fonts.ready : Promise.resolve()).then(placeSparks);

  /* ---------- treatments: a picture follows the cursor; rows open on tap ---------- */
  const rows = $$('.row'), follow = $('#follow'), fImgs = $$('img', follow);
  rows.forEach(r => r.addEventListener('click', () => {
    const open = r.getAttribute('aria-expanded') !== 'true';
    rows.forEach(x => x.setAttribute('aria-expanded', String(x === r && open)));
  }));
  if (FINE && !RM) {
    let x = 0, y = 0, fx = 0, fy = 0, on = false;
    const loop = () => { fx += (x - fx) * 0.14; fy += (y - fy) * 0.14; follow.style.left = fx + 'px'; follow.style.top = fy + 'px'; requestAnimationFrame(loop); }; loop();
    $('#svc').addEventListener('pointermove', e => { x = e.clientX + 170; y = e.clientY; if (!on) { fx = x; fy = y; } });
    rows.forEach(r => r.addEventListener('pointerenter', () => { on = true; follow.classList.add('on'); fImgs.forEach((im, i) => im.classList.toggle('on', i === +r.dataset.img)); }));
    $('#svc').addEventListener('pointerleave', () => { on = false; follow.classList.remove('on'); });
  }

  /* ---------- odometer numbers ---------- */
  $$('[data-odo]').forEach(el => {
    el.setAttribute('aria-label', el.dataset.odo);
    el.innerHTML = [...el.dataset.odo].map(c => /\d/.test(c)
      ? `<span class="d" aria-hidden="true" data-v="${c}"><i>${'0123456789'.split('').map(n => `<b>${n}</b>`).join('')}</i></span>`
      : `<span class="s" aria-hidden="true" style="${/[a-z]/i.test(c) || c === ' ' ? 'font-size:max(12.5px,.42em);align-self:flex-end;margin-bottom:.18em;white-space:pre' : ''}">${c}</span>`).join('');
  });
  const roll = el => $$('.d', el).forEach((d, i) => setTimeout(() => ($('i', d).style.transform = `translateY(-${d.dataset.v}em)`), i * 120));
  if (!ANIM) $$('[data-odo]').forEach(el => $$('.d', el).forEach(d => { $('i', d).style.transition = 'none'; $('i', d).style.transform = `translateY(-${d.dataset.v}em)`; }));
  else $$('[data-odo]').forEach(el => ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => roll(el) }));

  /* ---------- stories viewer ---------- */
  const DATA = [
    { who: 'Ishita', q: '“Six shades brighter, two weeks before my wedding. My photographer asked what my secret was.”', t: 'Whitening · 1 visit' },
    { who: 'Aarav, 7', q: '“The dentist let me press the chair button and there were cartoons on the ceiling!”', t: 'Kids’ check-up' },
    { who: 'Rohan & mom', q: '“Mom had been chewing on one side for years. Two implants later she’s eating corn again.”', t: 'Implants · 3 visits' },
    { who: 'Zoya', q: '“Nine months of aligners and nobody at work ever noticed. Now everyone notices the smile.”', t: 'Clear aligners · 9 months' },
    { who: 'Kamala, 76', q: '“My old dentures clicked when I talked. These fit so well I forget they are there.”', t: 'Dentures' },
  ];
  const viewer = $('#viewer'), cards = $$('.story'), bars = $('#vBars');
  bars.innerHTML = DATA.map(() => '<span><i></i></span>').join('');
  const barEls = $$('span', bars);
  let si = 0, prog = 0, paused = false, raf = 0, lastT = 0;
  const show = i => {
    si = i; prog = 0;
    const img = $('img', cards[i]); $('#vImg').src = img.currentSrc || img.src; $('#vImg').alt = img.alt;
    $('#vWho').textContent = DATA[i].who; $('#vQ').textContent = DATA[i].q; $('#vT').textContent = DATA[i].t;
    barEls.forEach((b, k) => { b.classList.toggle('done', k < i); $('i', b).style.transform = k < i ? 'none' : 'scaleX(0)'; });
  };
  const tick = now => {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(100, now - (lastT || now)); lastT = now;
    if (paused || RM) return;
    prog += dt / 5200; $('i', barEls[si]).style.transform = `scaleX(${Math.min(1, prog)})`;
    if (prog >= 1) { if (si < DATA.length - 1) show(si + 1); else close(); }
  };
  const open = i => { show(i); viewer.classList.add('open'); viewer.setAttribute('aria-hidden', 'false'); lenis && lenis.stop(); lastT = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); $('#vClose').focus(); };
  function close() { viewer.classList.remove('open'); viewer.setAttribute('aria-hidden', 'true'); cancelAnimationFrame(raf); lenis && lenis.start(); }
  cards.forEach((c, i) => c.addEventListener('click', () => open(i)));
  $('#vClose').addEventListener('click', close);
  $('.vnext').addEventListener('click', () => (si < DATA.length - 1 ? show(si + 1) : close()));
  $('.vprev').addEventListener('click', () => show(Math.max(0, si - 1)));
  const frame = $('.vframe');
  frame.addEventListener('pointerdown', () => (paused = true));
  addEventListener('pointerup', () => (paused = false));
  viewer.addEventListener('click', e => { if (e.target === viewer) close(); });
  addEventListener('keydown', e => { if (!viewer.classList.contains('open')) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') $('.vnext').click(); if (e.key === 'ArrowLeft') $('.vprev').click(); });

  /* ---------- membership card tilts toward the cursor ---------- */
  const card = $('#mcard'), club = $('.club');
  if (FINE && !RM) {
    club.addEventListener('pointermove', e => { const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--ry', ((x - 0.5) * 22).toFixed(1) + 'deg'); card.style.setProperty('--rx', ((0.5 - y) * 18).toFixed(1) + 'deg');
      card.style.setProperty('--gx', (x * 100).toFixed(0) + '%'); card.style.setProperty('--gy', (y * 100).toFixed(0) + '%'); });
    club.addEventListener('pointerleave', () => { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
  } else if (!RM && ANIM) {
    gsap.to(card, { '--ry': '10deg', '--rx': '6deg', '--gx': '80%', duration: 2.4, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  }

  /* ---------- chat booking ---------- */
  const msgs = $('#msgs'), opts = $('#opts'), st = {};
  const scrollDown = () => (msgs.scrollTop = msgs.scrollHeight);
  const bubble = (text, who) => { const m = document.createElement('div'); m.className = 'msg ' + who; m.textContent = text; msgs.appendChild(m); scrollDown(); return m; };
  const bot = (text, then) => {
    opts.innerHTML = '';
    const ty = document.createElement('div'); ty.className = 'msg bot typing'; ty.innerHTML = '<i></i><i></i><i></i>'; msgs.appendChild(ty); scrollDown();
    setTimeout(() => { ty.remove(); bubble(text, 'bot'); then && then(); }, RM ? 0 : 700);
  };
  const choices = (list, key, next) => {
    opts.innerHTML = list.map(c => `<button type="button">${c}</button>`).join('');
    $$('button', opts).forEach(b => b.addEventListener('click', () => { st[key] = b.textContent; bubble(b.textContent, 'me'); next(); }));
  };
  const step1 = () => bot('Hi! I’m the GLEAM front desk. What brings you in?', () => choices(['Whitening', 'Aligners', 'Check-up & clean', 'Toothache', 'Implants', 'For my kid'], 'what', step2));
  const step2 = () => bot(st.what === 'Toothache' ? 'Ouch, sorry. We keep slots free for that. When can you come?' : 'Nice choice. When suits you?', () => choices(['Today evening', 'Tomorrow', 'This weekend', 'Next week'], 'when', step3));
  const step3 = () => bot('Last thing: your name and mobile, so we can confirm on WhatsApp.', () => {
    opts.innerHTML = '<form id="cf"><input id="cn" placeholder="Your name" autocomplete="name" aria-label="Your name"><input id="cp" placeholder="Mobile" inputmode="tel" autocomplete="tel" aria-label="Mobile number"><button type="submit" aria-label="Send"><svg class="ic" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button></form>';
    $('#cf').addEventListener('submit', e => {
      e.preventDefault(); const n = $('#cn').value.trim(), p = $('#cp').value.replace(/\D/g, '').slice(-10);
      if (n.length < 2) { $('#cn').focus(); return say('Add your name so we know who to expect.'); }
      if (!/^[6-9]\d{9}$/.test(p)) { $('#cp').focus(); return say('Add a 10-digit mobile number so we can confirm on WhatsApp.'); }
      bubble(`${n} · ${p.replace(/(\d{5})(\d{5})/, '$1 $2')}`, 'me');
      bot(`Done, ${n.split(' ')[0]}! ${st.what}, ${st.when.toLowerCase()}. We’ll confirm the exact time on WhatsApp in a few minutes.`, () => { opts.innerHTML = '<button type="button" id="again">Book for someone else</button>'; $('#again').addEventListener('click', reset); say('Demo template: on your clinic’s site this booking lands in your WhatsApp.'); });
    });
  });
  const reset = () => { msgs.innerHTML = ''; step1(); };
  $('#chatReset').addEventListener('click', reset);
  let chatStarted = false;
  const startChat = () => { if (!chatStarted) { chatStarted = true; step1(); } };
  if ('IntersectionObserver' in window) { const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); startChat(); } }, { threshold: 0.3 }); io.observe($('#chat')); } else startChat();

  /* ---------- FAQ: smooth open and close ---------- */
  $$('.qa details').forEach(d => {
    const s = $('summary', d), b = $('.qa-b', d);
    s.addEventListener('click', e => {
      if (RM || !b.animate) return; e.preventDefault();
      if (d.open) { const h = b.offsetHeight; b.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 300, easing: 'ease' }).onfinish = () => (d.open = false); }
      else { d.open = true; const h = b.offsetHeight; b.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.3,1.4,.5,1)' }); }
    });
  });

  /* ---------- footer word follows the cursor ---------- */
  const gw = $('#gleam');
  if (FINE) $('.foot').addEventListener('pointermove', e => gw.style.setProperty('--mx', (e.clientX / innerWidth * 100).toFixed(1) + '%'));

  if (!ANIM) return;

  /* ---------- motion ---------- */
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    $$('.hero h1 .ln').forEach(l => { l.style.overflow = 'hidden'; l.style.paddingBottom = '.1em'; l.style.marginBottom = '-.1em'; });
    const tl = gsap.timeline({ delay: 0.1 });
    tl.from('.hero h1 .ln > span', { yPercent: 115, duration: 1.1, ease: 'expo.out', stagger: 0.1 }, 0)
      .from('#hint', { opacity: 0, y: 10, duration: 0.6 }, 0.8)
      .to($$('.hero [data-up]'), { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, onComplete: shown($$('.hero [data-up]')) }, 0.5)
      .from('.hdr', { yPercent: -100, opacity: 0, duration: 0.8, ease: 'power3.out', clearProps: 'transform,opacity' }, 0);
    // words spread apart as the hero scrolls away
    const st = { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true };
    gsap.to('.hero .l1 > span', { xPercent: -18, ease: 'none', scrollTrigger: st });
    gsap.to('.hero .l3 > span', { xPercent: 18, ease: 'none', scrollTrigger: st });
    gsap.to('.hero .hero-row, #hint', { y: -60, opacity: 0, ease: 'none', scrollTrigger: { ...st, end: '60% top' } });
    ScrollTrigger.batch($$('[data-up]').filter(el => !el.closest('.hero')), { start: 'top 90%', once: true, onEnter: els => gsap.to(els, { opacity: 1, y: 0, duration: 0.9, ease: 'back.out(1.4)', stagger: 0.07, onComplete: shown(els) }) });
    gsap.from('.row', { y: 30, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.06, scrollTrigger: { trigger: '#svc', start: 'top 85%' }, clearProps: 'transform,opacity' });
    gsap.from('#gleam', { yPercent: 40, ease: 'none', scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'bottom bottom', scrub: true } });
    addEventListener('load', () => ScrollTrigger.refresh());
  });
})();
