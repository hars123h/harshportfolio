/* Atelier template · before/after slider, makeover estimate, quotes, consultation form, motion. */
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
  const shown = els => () => els.forEach(e => { e.classList.add('shown'); e.style.transform = ''; e.style.opacity = ''; e.style.clipPath = ''; });
  const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (!RM && window.Lenis && FINE) {
    lenis = new Lenis({ lerp: 0.09 });
    if (G) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
    else { const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'), t = id.length > 1 && $(id); if (!t) return;
    e.preventDefault(); closeMenu(); lenis ? lenis.scrollTo(t, { offset: -80, duration: 1.5 }) : t.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
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

  /* ---------- before / after ---------- */
  const ba = $('#ba');
  const setPos = p => { p = Math.max(0, Math.min(100, p)); ba.style.setProperty('--pos', p + '%'); ba.setAttribute('aria-valuenow', Math.round(p)); };
  let dragging = false, touched = false;
  const fromEvent = e => { const r = ba.getBoundingClientRect(); setPos(((e.clientX - r.left) / r.width) * 100); };
  ba.addEventListener('pointerdown', e => { dragging = true; touched = true; ba.setPointerCapture(e.pointerId); fromEvent(e); });
  ba.addEventListener('pointermove', e => { if (dragging) fromEvent(e); });
  ba.addEventListener('pointerup', () => (dragging = false)); ba.addEventListener('pointercancel', () => (dragging = false));
  ba.addEventListener('keydown', e => {
    const v = +ba.getAttribute('aria-valuenow');
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { setPos(v - 5); e.preventDefault(); }
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { setPos(v + 5); e.preventDefault(); }
    if (e.key === 'Home') setPos(0); if (e.key === 'End') setPos(100);
  });
  setPos(50);
  // one gentle sweep so visitors see it moves
  if (ANIM) { const o = { p: 50 }; gsap.timeline({ delay: 1.2 }).to(o, { p: 18, duration: 1, ease: 'power2.inOut', onUpdate: () => !touched && setPos(o.p) }).to(o, { p: 80, duration: 1.4, ease: 'power2.inOut', onUpdate: () => !touched && setPos(o.p) }).to(o, { p: 50, duration: 1, ease: 'power2.inOut', onUpdate: () => !touched && setPos(o.p) }); }

  /* ---------- makeover estimate ---------- */
  const rVen = $('#rVen'), rBond = $('#rBond'), cWhite = $('#cWhite'), cAlign = $('#cAlign'), cGum = $('#cGum');
  const totalEl = $('#total'), emiEl = $('#emi'), lines = $('#lines'); let shownTotal = 0;
  const fill = r => r.style.setProperty('--f', (r.value / r.max * 100) + '%');
  function calc() {
    const v = +rVen.value, b = +rBond.value, items = [];
    $('#oVen').textContent = v + (v === 1 ? ' tooth' : ' teeth'); $('#oBond').textContent = b + (b === 1 ? ' tooth' : ' teeth');
    fill(rVen); fill(rBond);
    if (cAlign.checked) items.push(['Clear aligners', 85000]);
    if (v) items.push([`${v} porcelain veneer${v > 1 ? 's' : ''}`, v * 16000]);
    if (b) items.push([`Bonding, ${b} tooth${b > 1 ? '' : ''}`.replace('tooth', b > 1 ? 'teeth' : 'tooth'), b * 4500]);
    if (cWhite.checked) items.push(['Professional whitening', 9000]);
    if (cGum.checked) items.push(['Gum contouring', 12000]);
    const total = items.reduce((s, i) => s + i[1], 0);
    lines.innerHTML = items.length ? items.map(i => `<li><span>${i[0]}</span><span>${inr(i[1])}</span></li>`).join('') : '<li class="none">Pick a treatment to start your estimate.</li>';
    emiEl.textContent = inr(total / 12);
    if (ANIM) { const o = { v: shownTotal }; gsap.to(o, { v: total, duration: 0.6, ease: 'power3.out', overwrite: true, onUpdate: () => (totalEl.textContent = inr(o.v)) }); }
    else totalEl.textContent = inr(total);
    shownTotal = total;
    $('#estGo').dataset.plan = items.map(i => i[0]).join(', ');
  }
  [rVen, rBond].forEach(r => r.addEventListener('input', calc));
  [cWhite, cAlign, cGum].forEach(c => c.addEventListener('change', calc));
  calc();
  $('#estGo').addEventListener('click', () => { const p = $('#estGo').dataset.plan; if (p) setTimeout(() => say('Your estimate is saved with the request: ' + p + '.'), 900); });

  /* ---------- quotes ---------- */
  const qs = $$('#vq figure'), qb = $$('.who button'); let qi = 0, qt;
  const showQ = i => { qi = i; qs.forEach((f, k) => f.classList.toggle('on', k === i)); qb.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i))); };
  const autoQ = () => { clearInterval(qt); if (!RM) qt = setInterval(() => showQ((qi + 1) % qs.length), 6500); };
  qb.forEach(b => b.addEventListener('click', () => { showQ(+b.dataset.i); autoQ(); }));
  autoQ();

  /* ---------- consultation ---------- */
  $$('#worries button').forEach(b => b.addEventListener('click', () => b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'))));
  $('#selfie').addEventListener('change', e => {
    const f = e.target.files && e.target.files[0]; if (!f || !f.type.startsWith('image/')) return;
    const url = URL.createObjectURL(f); $('#thumb').innerHTML = `<img src="${url}" alt="Your smile photo">`; $('#upT').textContent = f.name.length > 28 ? f.name.slice(0, 25) + '…' : f.name;
  });
  $('#cform').addEventListener('submit', e => {
    e.preventDefault();
    const nm = $('#nm'), ph = $('#ph');
    if (nm.value.trim().length < 2) { nm.focus(); return say('Please add your name.'); }
    if (!/^[6-9]\d{9}$/.test(ph.value.replace(/\D/g, '').slice(-10))) { ph.focus(); return say('Please add a 10-digit mobile number.'); }
    say('Demo template: on your clinic’s site this request, with the photo, reaches you on WhatsApp.');
    e.target.reset(); $$('#worries button').forEach(b => b.setAttribute('aria-pressed', 'false'));
  });

  /* ---------- FAQ ---------- */
  $$('.qa details').forEach(d => {
    const s = $('summary', d), b = $('.qa-b', d);
    s.addEventListener('click', e => {
      if (RM || !b.animate) return; e.preventDefault();
      if (d.open) { const h = b.offsetHeight; b.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 320, easing: 'ease' }).onfinish = () => (d.open = false); }
      else { d.open = true; const h = b.offsetHeight; b.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 480, easing: 'cubic-bezier(.2,.8,.2,1)' }); }
    });
  });

  /* ---------- counters ---------- */
  const count = el => { const to = +el.dataset.count, suf = el.dataset.suffix || '', f = n => Math.round(n).toLocaleString('en-IN') + suf;
    if (!ANIM) { el.textContent = f(to); return; } const o = { v: 0 }; gsap.to(o, { v: to, duration: 1.8, ease: 'power3.out', onUpdate: () => (el.textContent = f(o.v)) }); };
  if (!ANIM) { $$('[data-count]').forEach(count); return; }

  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    const heroUps = $$('.hero [data-up]');
    gsap.timeline({ delay: 0.1 })
      .from('.hdr', { yPercent: -100, opacity: 0, duration: 0.9, ease: 'power3.out', clearProps: 'transform,opacity' }, 0)
      .to(heroUps, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.1, onComplete: shown(heroUps) }, 0.1)
      .from('.ba', { clipPath: 'inset(0 0 100% 0)', duration: 1.4, ease: 'expo.inOut' }, 0.3);
    ScrollTrigger.batch($$('[data-up]').filter(el => !el.closest('.hero')), { start: 'top 90%', once: true, onEnter: els => gsap.to(els, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.08, onComplete: shown(els) }) });
    $$('[data-clip]').forEach(el => ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: () => gsap.fromTo(el, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1.4, ease: 'expo.inOut', onComplete: shown([el]) }) }));
    $$('.sp-img .frame img').forEach(img => gsap.fromTo(img, { scale: 1.15, yPercent: -4 }, { scale: 1, yPercent: 4, ease: 'none', scrollTrigger: { trigger: img.closest('.sp-img'), start: 'top bottom', end: 'bottom top', scrub: true } }));
    $$('.sp-img .no').forEach(n => gsap.fromTo(n, { yPercent: 30 }, { yPercent: -30, ease: 'none', scrollTrigger: { trigger: n.closest('.sp-img'), start: 'top bottom', end: 'bottom top', scrub: true } }));
    gsap.fromTo('#labImg', { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: '.lab-sec', start: 'top bottom', end: 'bottom top', scrub: true } });
    $$('[data-count]').forEach(el => ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => count(el) }));
    gsap.from('.sign', { xPercent: 12, ease: 'none', scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'bottom bottom', scrub: true } });
    addEventListener('load', () => ScrollTrigger.refresh());
  });
})();
