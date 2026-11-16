/* Ivora template · page motion: smooth scroll, reveals, chapter switching, studio gallery, booking. */
(() => {
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const IV = (window.IVORA = window.IVORA || { shade: null });
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  root.classList.add('js');

  /* split headings into words so each line can rise in */
  $$('.split').forEach(el => {
    const wrap = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const w = document.createElement('span'); w.className = 'w';
            const i = document.createElement('span'); i.textContent = part; w.appendChild(i); frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) wrap(n);
      });
    };
    wrap(el);
  });

  /* smooth scroll */
  let lenis = null;
  if (!RM && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.9 });
    window.__lenis = lenis;
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(time => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf);
    }
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); const t = id.length > 1 && $(id);
    if (!t) return;
    e.preventDefault(); closeMenu();
    lenis ? lenis.scrollTo(t, { offset: id === '#story' ? 0 : -70, duration: 1.4 }) : t.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
  }));

  /* nav */
  const nav = $('#nav');
  const demo = $('.demo'); let lastY = scrollY;
  const onScroll = () => {
    nav.classList.toggle('scrolled', scrollY > 30);
    // demo badge tucks away while reading down, comes back on scroll up
    if (demo) { const y = scrollY; const first = y < innerHeight * 0.7, phone = innerWidth < 641;
      if (first || (phone && y > lastY + 6)) demo.classList.add('tuck'); else if (!phone || y < lastY - 6) demo.classList.remove('tuck'); lastY = y; }
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const menuBtn = $('#menuBtn'), sheet = $('#sheet');
  function closeMenu() { sheet.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); lenis && lenis.start(); }
  menuBtn.addEventListener('click', () => {
    const open = !sheet.classList.contains('open');
    sheet.classList.toggle('open', open); menuBtn.setAttribute('aria-expanded', String(open));
    lenis && (open ? lenis.stop() : lenis.start());
  });

  /* story chapters follow scroll */
  const story = $('#story'), chapters = $$('.chapter'), rail = $$('.rail li'), bar = $('#bar');
  let current = 0;
  function storyTick() {
    const r = story.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)));
    const ch = Math.min(3, Math.floor(p * 4));
    if (bar) bar.style.transform = `scaleX(${p.toFixed(4)})`;
    if (ch !== current) {
      current = ch;
      chapters.forEach((c, i) => c.classList.toggle('on', i === ch));
      rail.forEach((l, i) => l.classList.toggle('on', i === ch));
      if (ch !== 1) shadeBtns.forEach(b => b.classList.remove('on'));
    }
  }
  const shadeBtns = $$('.shades button');
  shadeBtns.forEach(b => b.addEventListener('click', () => {
    shadeBtns.forEach(x => x.classList.toggle('on', x === b));
    IV.shade = getComputedStyle(b).getPropertyValue('--c').trim();
  }));
  addEventListener('scroll', storyTick, { passive: true }); storyTick();

  /* toast */
  const toast = $('#toast'); let tt;
  const say = msg => { toast.textContent = msg; toast.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('show'), 4200); };

  /* booking: on a real clinic site this opens WhatsApp with the request filled in */
  $('#book').addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const msg = `Hi Ivora, I'd like to book: ${f.get('treatment')} (${f.get('day')}). Name: ${f.get('name')}, phone: ${f.get('phone')}.`;
    IV.lastBooking = msg;
    say('Demo template: on your clinic’s site this request opens straight in your WhatsApp.');
    e.target.reset();
  });

  /* counters */
  const countUp = el => {
    const to = parseFloat(el.dataset.to), dec = +(el.dataset.dec || 0);
    if (RM) { el.textContent = to.toFixed(dec); return; }
    const t0 = performance.now(), d = 1400;
    const step = now => { const k = Math.min(1, (now - t0) / d), e = 1 - Math.pow(1 - k, 3); el.textContent = (to * e).toFixed(dec); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };

  if (!hasGsap || RM) {
    $$('.reveal').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
    $$('.count').forEach(countUp);
    if (!hasGsap) return;
  }
  gsap.registerPlugin(ScrollTrigger);
  if (RM) return;

  /* hero entrance */
  const heroWords = $$('.hero .split .w > span');
  gsap.from(heroWords, { yPercent: 110, duration: 1.1, ease: 'power4.out', stagger: 0.06, delay: 0.15 });
  gsap.to($$('.hero .reveal'), { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.1, delay: 0.55 });
  gsap.from('.nav', { yPercent: -100, opacity: 0, duration: 0.9, ease: 'power3.out', delay: 0.1, clearProps: 'transform,opacity' });
  setTimeout(() => $$('.hero .count').forEach(countUp), 700);

  /* headings and blocks below the fold */
  $$('.split').filter(el => !el.closest('.hero')).forEach(el => {
    gsap.from($$('.w > span', el), { yPercent: 110, duration: 1, ease: 'power4.out', stagger: 0.045, scrollTrigger: { trigger: el, start: 'top 85%' } });
  });
  $$('.reveal').filter(el => !el.closest('.hero') && !el.classList.contains('card')).forEach(el => {
    gsap.to(el, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });
  ScrollTrigger.batch('.cards .card', { start: 'top 88%', onEnter: els => gsap.to(els, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, overwrite: true, onComplete: () => els.forEach(e => { e.classList.add('in'); e.style.transform = ''; }) }) });
  $$('.reviews .count').forEach(el => ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: () => countUp(el) }));

  /* images ease up a little inside their frames */
  $$('.doc .ph img').forEach(img => gsap.fromTo(img, { scale: 1.12 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true } }));

  /* studio: vertical scroll moves the gallery sideways (desktop) */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 761px)', () => {
    const track = $('#track');
    const dist = () => Math.max(0, track.scrollWidth - (innerWidth - track.getBoundingClientRect().left) + innerWidth * 0.06);
    gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: '.studio', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.6, invalidateOnRefresh: true }
    });
  });

  /* footer word drifts up */
  gsap.from('.word', { yPercent: 30, ease: 'none', scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'bottom bottom', scrub: true } });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
