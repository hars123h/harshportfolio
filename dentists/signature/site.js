/* Dr. Signature template · one script for all three pages. */
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

  /* ---------- iris page transition: a black circle grows from where you click ---------- */
  const iris = $('#iris'), canAnim = !RM && iris && iris.animate;
  if (canAnim) {
    let came = false; try { came = sessionStorage.getItem('iris') === '1'; sessionStorage.removeItem('iris'); } catch (_) {}
    if (came) { iris.style.clipPath = 'circle(150% at 50% 50%)'; iris.classList.add('full');
      requestAnimationFrame(() => { iris.classList.remove('full'); iris.animate([{ clipPath: 'circle(150% at 50% 50%)' }, { clipPath: 'circle(0% at 50% 50%)' }], { duration: 750, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' }).onfinish = () => (iris.style.clipPath = ''); }); }
    document.addEventListener('click', e => {
      const a = e.target.closest('a'); if (!a) return;
      const href = a.getAttribute('href') || '';
      if (a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || !/\.html(\?|#|$)/.test(href) || /^(https?:|tel:|mailto:)/.test(href)) return;
      e.preventDefault();
      const x = (e.clientX || innerWidth / 2) + 'px', y = (e.clientY || innerHeight / 2) + 'px';
      try { sessionStorage.setItem('iris', '1'); } catch (_) {}
      iris.classList.add('full');
      iris.animate([{ clipPath: `circle(0% at ${x} ${y})` }, { clipPath: `circle(150% at ${x} ${y})` }], { duration: 650, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' }).onfinish = () => (location.href = a.href);
    });
    addEventListener('pageshow', e => { if (e.persisted) { iris.getAnimations().forEach(an => an.cancel()); iris.classList.remove('full'); iris.style.clipPath = ''; } });
  }

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (!RM && window.Lenis && FINE) {
    lenis = new Lenis({ lerp: 0.09 });
    if (G) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
    else { const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
  }

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
  menuBtn.addEventListener('click', () => { const open = !sheet.classList.contains('open'); sheet.classList.toggle('open', open); menuBtn.setAttribute('aria-expanded', String(open)); sheet.setAttribute('aria-hidden', String(!open)); lenis && (open ? lenis.stop() : lenis.start()); });
  const toast = $('#toast'); let tt;
  const say = m => { toast.textContent = m; toast.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('show'), 4600); };

  /* ---------- signature writes itself over the name ---------- */
  const sig = $('#sig');
  if (sig) {
    const txt = $('text', sig);
    const finish = () => sig.classList.add('done');
    const go = () => { if (RM || !txt.animate) return finish(); txt.animate([{ strokeDashoffset: 1400 }, { strokeDashoffset: 0 }], { duration: 2600, easing: 'cubic-bezier(.45,.05,.3,1)', fill: 'forwards' }).onfinish = finish; };
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => setTimeout(go, 700));
  }

  /* ---------- practice cards: hover flips on desktop, tap flips on phones ---------- */
  $$('.plate').forEach(p => p.addEventListener('click', () => p.setAttribute('aria-pressed', String(p.getAttribute('aria-pressed') !== 'true'))));

  /* ---------- letters: drag sideways with a mouse ---------- */
  const notes = $('.notes');
  if (notes && FINE) {
    let down = false, sx = 0, sl = 0;
    notes.addEventListener('pointerdown', e => { down = true; sx = e.clientX; sl = notes.scrollLeft; notes.style.scrollSnapType = 'none'; notes.style.cursor = 'grabbing'; });
    addEventListener('pointermove', e => { if (down) notes.scrollLeft = sl - (e.clientX - sx); });
    addEventListener('pointerup', () => { if (!down) return; down = false; notes.style.scrollSnapType = ''; notes.style.cursor = ''; });
    notes.style.cursor = 'grab';
  }

  /* ---------- booking calendar ---------- */
  const bk = $('#bk');
  if (bk) {
    const ist = () => { const n = new Date(); return new Date(n.getTime() + (n.getTimezoneOffset() + 330) * 60000); };
    const now = ist(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const WEEK = ['10:00', '10:45', '11:30', '12:15', '14:00', '14:45', '15:30', '16:15', '17:00', '17:45'], SAT = ['10:00', '10:45', '11:30', '12:15', '13:00'];
    const fmtT = t => { let [h, m] = t.split(':').map(Number); const ap = h >= 12 ? 'PM' : 'AM'; return ((h + 11) % 12 + 1) + ':' + String(m).padStart(2, '0') + ' ' + ap; };
    let view = new Date(today.getFullYear(), today.getMonth(), 1), pick = null, time = null;
    const maxView = new Date(today.getFullYear(), today.getMonth() + 2, 1);
    const daysEl = $('#days'), slotsEl = $('#slots'), chosen = $('#chosen');
    const label = () => { chosen.textContent = pick ? pick.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }) + (time ? ' · ' + fmtT(time) : ' · pick a time') + ' · ' + $('#why').value : 'No date chosen yet.'; };
    function drawMonth() {
      $('#calM').textContent = view.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      $('#calPrev').disabled = view <= new Date(today.getFullYear(), today.getMonth(), 1);
      $('#calNext').disabled = view >= maxView;
      const first = (view.getDay() + 6) % 7, n = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
      let html = '<span></span>'.repeat(first);
      for (let d = 1; d <= n; d++) {
        const dt = new Date(view.getFullYear(), view.getMonth(), d), off = dt < today || dt.getDay() === 0;
        const sel = pick && dt.getTime() === pick.getTime(), isT = dt.getTime() === today.getTime();
        html += `<button type="button" data-d="${d}" ${off ? 'disabled' : ''} class="${isT ? 'today' : ''}" aria-pressed="${sel}" aria-label="${dt.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}">${d}</button>`;
      }
      daysEl.innerHTML = html;
      $$('button', daysEl).forEach(b => b.addEventListener('click', () => { pick = new Date(view.getFullYear(), view.getMonth(), +b.dataset.d); time = null; drawMonth(); drawSlots(); label(); }));
    }
    function drawSlots() {
      if (!pick) { slotsEl.innerHTML = '<span class="empty">Choose a date first.</span>'; return; }
      const list = pick.getDay() === 6 ? SAT : WEEK, isToday = pick.getTime() === today.getTime(), nowH = now.getHours() + now.getMinutes() / 60;
      const html = list.map((t, i) => { const [h, m] = t.split(':').map(Number), past = isToday && h + m / 60 < nowH + 1, taken = (pick.getDate() * 3 + i * 5) % 7 === 0;
        return `<button type="button" data-t="${t}" ${past || taken ? 'disabled' : ''} aria-pressed="${time === t}">${fmtT(t)}</button>`; }).join('');
      slotsEl.innerHTML = /button type="button" data-t="[^"]+" (?!disabled)/.test(html) ? html : '<span class="empty">Fully booked. Try another day.</span>';
      $$('button', slotsEl).forEach(b => b.addEventListener('click', () => { time = b.dataset.t; $$('button', slotsEl).forEach(x => x.setAttribute('aria-pressed', String(x === b))); label(); }));
    }
    $('#calPrev').addEventListener('click', () => { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); drawMonth(); });
    $('#calNext').addEventListener('click', () => { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); drawMonth(); });
    $('#why').addEventListener('change', label);
    drawMonth(); drawSlots();
    bk.addEventListener('submit', e => {
      e.preventDefault();
      if (!pick) return say('Please choose a date on the calendar.');
      if (!time) return say('Please choose a time.');
      if ($('#nm').value.trim().length < 2) { $('#nm').focus(); return say('Please add your name.'); }
      if (!/^[6-9]\d{9}$/.test($('#ph').value.replace(/\D/g, '').slice(-10))) { $('#ph').focus(); return say('Please add a 10-digit mobile number.'); }
      say('Demo template: on your clinic’s site this appointment request reaches you on WhatsApp.');
    });
  }

  /* ---------- counters ---------- */
  const count = el => { const to = +el.dataset.count, f = n => Math.round(n).toLocaleString('en-IN');
    if (!ANIM) { el.textContent = f(to); return; } const o = { v: 0 }; gsap.to(o, { v: to, duration: 2, ease: 'power3.out', onUpdate: () => (el.textContent = f(o.v)) }); };
  if (!ANIM) { $$('[data-count]').forEach(count); return; }

  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    const top = $('.hero,.phead'), ups = $$('[data-up]', top);
    gsap.timeline({ delay: 0.15 })
      .from('.hdr', { yPercent: -100, opacity: 0, duration: 0.9, ease: 'power3.out', clearProps: 'transform,opacity' }, 0)
      .to(ups, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.1, onComplete: shown(ups) }, 0.1);
    if ($('.portrait')) {
      gsap.from('.portrait img', { scale: 1.25, duration: 2.4, ease: 'expo.out' });
      gsap.to('.portrait img', { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    }
    ScrollTrigger.batch($$('[data-up]').filter(el => !el.closest('.hero,.phead')), { start: 'top 90%', once: true, onEnter: els => gsap.to(els, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.08, onComplete: shown(els) }) });
    $$('[data-count]').forEach(el => ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => count(el) }));
    $$('.gal figure img').forEach(img => gsap.fromTo(img, { scale: 1.15 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true } }));
    gsap.from('.sigline', { xPercent: -10, ease: 'none', scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'bottom bottom', scrub: true } });
    addEventListener('load', () => ScrollTrigger.refresh());
  });
})();
