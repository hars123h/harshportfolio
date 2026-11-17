/* Star Dental Care · site behaviour (no libraries) */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement, top = $('#top');
  const store = { get(k){ try { return sessionStorage.getItem(k); } catch(_) { return null; } }, set(k, v){ try { sessionStorage.setItem(k, v); } catch(_) {} } };
  const CL = window.CLINICS || {};

  /* ---------- header ---------- */
  const setH = () => root.style.setProperty('--hh', top.offsetHeight + 'px');
  if ($('#ribbon') && store.get('rb-hide')) $('#ribbon').remove();
  $('.rb-x')?.addEventListener('click', () => { store.set('rb-hide', '1'); $('#ribbon')?.remove(); setH(); });
  setH();
  if (window.ResizeObserver) new ResizeObserver(setH).observe(top); else addEventListener('resize', setH);
  let locked = false, lockY = 0;
  const onScroll = () => { if (!locked) top.classList.toggle('scrolled', scrollY > 40); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- mobile menu ---------- */
  const sheet = $('#sheet'), menuBtn = $('.menu-btn');
  function lock(on) {
    const b = document.body.style;
    if (on && !locked) { locked = true; lockY = scrollY; Object.assign(b, { position: 'fixed', top: -lockY + 'px', left: '0', right: '0', width: '100%' }); }
    else if (!on && locked) { Object.assign(b, { position: '', top: '', left: '', right: '', width: '' }); scrollTo({ top: lockY, behavior: 'instant' }); locked = false; }
  }
  function setMenu(open) {
    sheet.classList.toggle('open', open); sheet.setAttribute('aria-hidden', !open);
    menuBtn.setAttribute('aria-expanded', open); menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    root.classList.toggle('menu-open', open); lock(open);
  }
  menuBtn?.addEventListener('click', () => setMenu(!sheet.classList.contains('open')));
  sheet?.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && sheet?.classList.contains('open')) { setMenu(false); menuBtn.focus(); } });
  matchMedia('(min-width:1080px)').addEventListener?.('change', m => { if (m.matches && sheet.classList.contains('open')) setMenu(false); });

  /* ---------- reveal ---------- */
  const rv = $$('.rv');
  if (!RM && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target, sib = [...el.parentElement.children].filter(c => c.classList.contains('rv'));
      el.style.transitionDelay = Math.min(sib.indexOf(el), 4) * 70 + 'ms';
      el.classList.add('shown'); io.unobserve(el);
      el.addEventListener('transitionend', () => { el.style.transitionDelay = ''; }, { once: true });
    }), { rootMargin: '0px 0px -8% 0px', threshold: .06 });
    rv.forEach(el => io.observe(el));
  } else rv.forEach(el => el.classList.add('shown'));

  /* ---------- before / after sliders ---------- */
  $$('[data-ba]').forEach((ba, n) => {
    const range = $('.ba-r', ba);
    const set = p => { p = Math.max(0, Math.min(100, p)); ba.style.setProperty('--pos', p + '%'); range.value = Math.round(p); };
    const fromX = x => { const r = ba.getBoundingClientRect(); set((x - r.left) / r.width * 100); };
    let down = false, sx = 0, sy = 0, decided = false, horiz = false;
    ba.addEventListener('pointerdown', e => {
      down = true; decided = e.pointerType === 'mouse'; horiz = decided; sx = e.clientX; sy = e.clientY;
      if (horiz) { ba.setPointerCapture(e.pointerId); fromX(e.clientX); }
    });
    ba.addEventListener('pointermove', e => {
      if (!down) return;
      if (!decided) {   // on touch, only take over when the finger moves sideways, so the page still scrolls
        const dx = Math.abs(e.clientX - sx), dy = Math.abs(e.clientY - sy);
        if (dx < 6 && dy < 6) return;
        decided = true; horiz = dx > dy;
        if (horiz) ba.setPointerCapture(e.pointerId);
      }
      if (horiz) fromX(e.clientX);
    });
    const end = e => { if (down && !decided && e.type === 'pointerup') fromX(e.clientX); down = false; };
    ba.addEventListener('pointerup', end); ba.addEventListener('pointercancel', end);
    range.addEventListener('input', () => set(+range.value));
    ba.addEventListener('keydown', e => { if (e.target !== range && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { range.focus(); } });
    // a short peek the first time it scrolls into view, so people see it moves
    if (!RM && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(([en]) => {
        if (!en.isIntersecting) return; io.disconnect();
        const frames = [[0, 50], [450, 72], [1000, 30], [1500, 50]]; const t0 = performance.now() + (n === 0 ? 700 : 200);
        const tick = now => {
          if (down) return;
          const t = now - t0; if (t < 0) return requestAnimationFrame(tick);
          let i = frames.findIndex(f => f[0] > t); if (i === -1) { set(50); return; }
          const [ta, pa] = frames[i - 1] || frames[0], [tb, pb] = frames[i];
          const k = (t - ta) / (tb - ta), ease = k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
          set(pa + (pb - pa) * ease); requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }, { threshold: .5 });
      io.observe(ba);
    }
  });

  /* ---------- lightbox ---------- */
  const lb = $('#lb');
  $$('.zoom').forEach(z => z.addEventListener('click', () => {
    if (!lb.showModal) { open(z.dataset.full, '_blank'); return; }
    const im = new Image(); im.src = z.dataset.full; im.alt = z.getAttribute('aria-label').replace('Enlarge: ', '');
    $('.lb-i', lb).replaceChildren(im); $('p', lb).textContent = z.closest('figure').querySelector('figcaption').textContent; lb.showModal();
  }));
  lb?.addEventListener('click', e => { if (e.target === lb || e.target.closest('.lb-x')) lb.close(); });

  /* ---------- clinic hours (IST) ---------- */
  const mins = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const fmt = t => { let [h, m] = t.split(':').map(Number); const s = h < 12 ? 'am' : 'pm'; if (h > 12) h -= 12; return m ? `${h}:${String(m).padStart(2, '0')} ${s}` : `${h} ${s}`; };
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  function ist() {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date()).map(x => [x.type, x.value]));
    return { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday), m: (+p.hour % 24) * 60 + +p.minute };
  }
  function status(s) {
    const { day, m } = ist(), today = s[day] || [];
    for (const [a, b] of today) if (m >= mins(a) && m < mins(b)) return { c: mins(b) - m <= 45 ? 'soon' : 'open', h: `<b>Open now</b> · until ${fmt(b)}` };
    const later = today.find(([a]) => mins(a) > m);
    if (later) return { c: 'closed', h: `<b>Closed now</b> · opens today at ${fmt(later[0])}` };
    for (let i = 1; i <= 7; i++) { const d = (day + i) % 7; if ((s[d] || []).length) return { c: 'closed', h: `<b>Closed now</b> · opens ${i === 1 ? 'tomorrow' : DAYS[d]} at ${fmt(s[d][0][0])}` }; }
    return { c: '', h: 'Opening hours' };
  }
  const paint = () => $$('[data-clinic]').forEach(el => { const st = status(CL[el.dataset.clinic].sched); el.className = 'status ' + st.c; $('span', el).innerHTML = st.h; });
  paint(); setInterval(paint, 60000);

  /* ---------- clinic tabs ---------- */
  const tabs = $$('.ctabs [role="tab"]');
  const pick = t => tabs.forEach(x => {
    const on = x === t, p = $('#' + x.getAttribute('aria-controls'));
    x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; p.hidden = !on;
    if (on) { const f = $('iframe', p); if (f && !f.getAttribute('src')) f.src = f.dataset.src; }
  });
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => pick(t));
    t.addEventListener('keydown', e => { const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (!k) return; e.preventDefault(); const n = tabs[(i + k + tabs.length) % tabs.length]; pick(n); n.focus(); });
  });

  /* ---------- booking ---------- */
  const form = $('#bookForm');
  if (form) {
    const note = $('#sendTo');
    const syncClinic = () => { const c = CL[form.clinic.value]; note.textContent = `Goes to Star Dental Care, ${c.name} on WhatsApp`; };
    form.clinic.addEventListener('change', syncClinic); syncClinic();
    // "Ask about this" on a treatment card picks it in the form
    $$('[data-ask]').forEach(b => b.addEventListener('click', () => {
      const o = [...form.treatment.options].find(o => o.text === b.dataset.ask); if (o) form.treatment.value = o.text;
      $('#book').scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
      form.classList.remove('ask-flash'); void form.offsetWidth; form.classList.add('ask-flash');
      setTimeout(() => form.name.focus({ preventScroll: true }), RM ? 0 : 700);
    }));
    const err = $('#formErr');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const name = form.name.value.trim(), phone = form.phone.value.trim(), ok = phone.replace(/\D/g, '').length >= 8;
      form.name.setAttribute('aria-invalid', !name); form.phone.setAttribute('aria-invalid', !ok);
      if (!name || !ok) { err.textContent = !name ? 'Please add your name.' : 'Please add a phone number we can reach you on.'; (!name ? form.name : form.phone).focus(); return; }
      err.textContent = '';
      const c = CL[form.clinic.value];
      const lines = [`Hello, I would like to book a free appointment at Star Dental Care, ${c.name}.`, `Name: ${name}`, `Phone: ${phone}`, `Treatment: ${form.treatment.value}`, `Preferred time: ${form.time.value}`];
      if (form.msg.value.trim()) lines.push(`Note: ${form.msg.value.trim()}`);
      window.open(`https://wa.me/${c.wa}?text=` + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
    });
    $$('input', form).forEach(i => i.addEventListener('input', () => i.removeAttribute('aria-invalid')));
  }

  $$('[data-year]').forEach(n => n.textContent = new Date().getFullYear());
})();
