/* Noida Dental Centre · interactions (no libraries) */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement, top = $('#top'), D = window.NDCN || {};
  const store = { get(k){ try { return sessionStorage.getItem(k); } catch(_) { return null; } }, set(k, v){ try { sessionStorage.setItem(k, v); } catch(_) {} } };

  /* header + menu */
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

  /* reveal */
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

  /* opening status (IST) */
  const mins = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const fmt = t => { let [h, m] = t.split(':').map(Number); const s = h < 12 ? 'am' : 'pm'; if (h > 12) h -= 12; return m ? `${h}:${String(m).padStart(2, '0')} ${s}` : `${h} ${s}`; };
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
    for (let i = 1; i <= 7; i++) { const d = (day + i) % 7; if ((H[d] || []).length) return { c: 'closed', h: `<b>Closed now</b> · opens ${i === 1 ? 'tomorrow' : DAYS[d]} at ${fmt(H[d][0][0])}` }; }
    return { c: '', h: 'Opening hours' };
  }
  const paint = () => { const s = status(); $$('[data-status]').forEach(el => { el.classList.remove('open', 'closed', 'soon'); if (s.c) el.classList.add(s.c); $('span', el).innerHTML = s.h; }); const { day } = ist(); $$('.hours tr').forEach(tr => tr.classList.toggle('today', +tr.dataset.day === day)); };
  paint(); setInterval(paint, 60000);

  /* age slider */
  $$('[data-age]').forEach(box => {
    const r = $('#ageR', box), n = $('#ageN', box), t = $('#ageT', box), d = $('#ageD', box), l = $('#ageL', box), A = D.ages || [];
    const set = v => {
      const band = A.find(a => v >= a.a && v <= a.b) || A[A.length - 1];
      box.dataset.k = band.k; n.textContent = v; t.textContent = band.t; d.textContent = band.d;
      l.innerHTML = band.p.map(([name, href]) => `<a href="${href}">${name}</a>`).join('');
      r.setAttribute('aria-valuetext', `Age ${v}: ${band.t}`);
    };
    r.addEventListener('input', () => set(+r.value)); set(+r.value);
    // a gentle demo sweep the first time it is seen
    if (!RM && 'IntersectionObserver' in window) {
      let touched = false; r.addEventListener('pointerdown', () => touched = true); r.addEventListener('keydown', () => touched = true);
      const io = new IntersectionObserver(([en]) => {
        if (!en.isIntersecting) return; io.disconnect();
        const seq = [8, 16, 30, 50, 70, 30]; let i = 0;
        const step = () => { if (touched || i >= seq.length) return; r.value = seq[i++]; set(+r.value); setTimeout(step, 900); };
        setTimeout(step, 600);
      }, { threshold: .6 });
      io.observe(box);
    }
  });

  /* gum stages */
  $$('[data-gum]').forEach(g => $$('.gs', g).forEach(b => b.addEventListener('click', () => {
    const s = b.dataset.stage; g.className = 'gumtool st-' + s;
    $$('.gs', g).forEach(x => x.setAttribute('aria-pressed', x === b)); $$('.gt', g).forEach(x => x.hidden = x.dataset.for !== s);
  })));

  /* missing teeth */
  $$('[data-missing]').forEach(m => $$('.mt', m).forEach(b => b.addEventListener('click', () => {
    $$('.mt', m).forEach(x => x.setAttribute('aria-pressed', x === b)); $$('.mp', m).forEach(p => p.hidden = p.dataset.for !== b.dataset.m);
  })));

  /* treatment filter by age group */
  const tg = $('#tgrid');
  $$('.tg-f button').forEach(b => b.addEventListener('click', () => {
    const on = b.getAttribute('aria-pressed') !== 'true';
    $$('.tg-f button').forEach(x => x.setAttribute('aria-pressed', x === b && on));
    $$('.tc', tg).forEach(c => c.hidden = on && !c.classList.contains({ children: 'c-orange', teens: 'c-blue', adults: 'c-red', seniors: 'c-magenta' }[b.dataset.g]));
  }));

  /* gallery filter + lightbox */
  $$('[data-gallery]').forEach(gal => $$('.gf button', gal).forEach(b => b.addEventListener('click', () => {
    $$('.gf button', gal).forEach(x => x.setAttribute('aria-pressed', x === b)); $$('.gi', gal).forEach(i => i.hidden = b.dataset.f !== 'all' && i.dataset.k !== b.dataset.f);
  })));
  const lb = $('#lb');
  $$('.zoom').forEach(z => z.addEventListener('click', () => {
    if (!lb.showModal) { open(z.dataset.full, '_blank'); return; }
    const im = new Image(); im.src = z.dataset.full; im.alt = z.getAttribute('aria-label').replace('Enlarge: ', '');
    $('.lb-i', lb).replaceChildren(im); $('p', lb).textContent = z.closest('figure').querySelector('figcaption').textContent; lb.showModal();
  }));
  lb?.addEventListener('click', e => { if (e.target === lb || e.target.closest('.lb-x')) lb.close(); });

  /* cleft counter */
  $$('[data-count]').forEach(el => {
    if (RM || !('IntersectionObserver' in window)) return;
    const to = +el.dataset.count; el.textContent = '0';
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return; io.disconnect(); const t0 = performance.now();
      const f = now => { const k = Math.min(1, (now - t0) / 1400); el.textContent = Math.round(to * (1 - (1 - k) ** 3)); if (k < 1) requestAnimationFrame(f); };
      requestAnimationFrame(f);
    }, { threshold: .6 });
    io.observe(el);
  });

  /* booking -> email */
  const form = $('#bookForm');
  if (form) {
    const today = new Date(Date.now() + 5.5 * 36e5).toISOString().slice(0, 10); form.date.min = today;
    const err = $('#formErr');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const name = form.name.value.trim(), phone = form.phone.value.trim(), ok = phone.replace(/\D/g, '').length >= 8, date = form.date.value;
      [['name', !name], ['phone', !ok], ['date', !date]].forEach(([k, bad]) => form[k].setAttribute('aria-invalid', bad));
      if (!name || !ok || !date) { err.textContent = !name ? 'Please add your name.' : !ok ? 'Please add a mobile number.' : 'Please choose a date.'; (!name ? form.name : !ok ? form.phone : form.date).focus(); return; }
      const dow = new Date(date + 'T12:00:00').getDay();
      if (dow === 0 && form.slot.selectedIndex === 1) { err.textContent = 'The clinic is closed on Sunday evenings. Please pick the morning or another day.'; form.slot.focus(); return; }
      err.textContent = '';
      const body = [`Name: ${name}`, `Mobile: ${phone}`, `Date: ${date}`, `Time: ${form.slot.value}`, `Treatment: ${form.treatment.value}`].concat(form.msg.value.trim() ? [`Note: ${form.msg.value.trim()}`] : []).join('\n');
      location.href = `mailto:${D.email}?subject=${encodeURIComponent('Appointment request: ' + name)}&body=${encodeURIComponent(body)}`;
    });
    $$('input', form).forEach(i => i.addEventListener('input', () => i.removeAttribute('aria-invalid')));
  }

  $$('[data-year]').forEach(n => n.textContent = new Date().getFullYear());
})();
