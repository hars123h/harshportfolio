/* Dr. Gaur's Dental Clinic · site behaviour (no libraries) */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const root = document.documentElement, top = $('#top');
  const store = { get(k){ try { return sessionStorage.getItem(k); } catch(_) { return null; } }, set(k, v){ try { sessionStorage.setItem(k, v); } catch(_) {} } };
  const WA = '919212151145';

  /* ---------- opening hours (IST) ---------- */
  const HOURS = { 0: [['10:30','14:00']], 1: [['10:30','13:30'],['17:00','20:30']], 2: [['10:30','13:30'],['17:00','20:30']], 3: [['10:30','13:30'],['17:00','20:30']],
                  4: [], 5: [['10:30','13:30'],['17:00','20:30']], 6: [['10:30','13:30'],['17:00','20:30']] };
  const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const mins = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const fmt = t => { let [h, m] = t.split(':').map(Number); const s = h < 12 ? 'am' : 'pm'; if (h > 12) h -= 12; return `${h}:${String(m).padStart(2, '0')} ${s}`; };
  function istNow() {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false })
      .formatToParts(new Date()).map(x => [x.type, x.value]));
    const day = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(p.weekday);
    return { day, m: (+p.hour % 24) * 60 + +p.minute };
  }
  function status() {
    const { day, m } = istNow();
    for (const [a, b] of HOURS[day]) {
      if (m >= mins(a) && m < mins(b)) {
        const left = mins(b) - m;
        return { cls: left <= 45 ? 'soon' : 'open', html: `<b>Open now</b> · until ${fmt(b)}` };
      }
    }
    const later = HOURS[day].find(([a]) => mins(a) > m);
    if (later) return { cls: 'closed', html: `<b>Closed now</b> · opens today at ${fmt(later[0])}` };
    for (let i = 1; i <= 7; i++) {
      const d = (day + i) % 7;
      if (HOURS[d].length) return { cls: 'closed', html: `<b>Closed${day === 4 ? ' on Thursdays' : ' now'}</b> · opens ${i === 1 ? 'tomorrow' : DAYS[d]} at ${fmt(HOURS[d][0][0])}` };
    }
    return { cls: '', html: 'Opening hours' };
  }
  function paintStatus() {
    const s = status();
    $$('[data-status]').forEach(el => { el.classList.remove('open', 'closed', 'soon'); if (s.cls) el.classList.add(s.cls); $('span', el).innerHTML = s.html; });
    const { day } = istNow();
    $$('.hours tr').forEach(tr => tr.classList.toggle('today', +tr.dataset.day === day));
  }
  paintStatus(); setInterval(paintStatus, 60000);

  /* ---------- fixed top bar height ---------- */
  const setH = () => root.style.setProperty('--hh', top.offsetHeight + 'px');
  if ($('#ribbon') && store.get('rb-hide')) $('#ribbon').remove();
  $('.rb-x')?.addEventListener('click', () => { store.set('rb-hide', '1'); $('#ribbon')?.remove(); setH(); });
  setH();
  if (window.ResizeObserver) new ResizeObserver(setH).observe(top); else addEventListener('resize', setH);
  let locked = false, lockY = 0;
  addEventListener('scroll', () => { if (!locked) top.classList.toggle('scrolled', scrollY > 8); }, { passive: true });

  /* ---------- desktop dropdowns ---------- */
  const dds = $$('.dd');
  const closeAll = except => dds.forEach(d => { if (d !== except) { $('.dd-p', d).classList.remove('open'); $('.dd-t', d).setAttribute('aria-expanded', 'false'); } });
  dds.forEach(dd => {
    const b = $('.dd-t', dd), p = $('.dd-p', dd); let t;
    const set = open => { if (open) closeAll(dd); p.classList.toggle('open', open); b.setAttribute('aria-expanded', open); };
    b.addEventListener('click', () => set(b.getAttribute('aria-expanded') !== 'true'));
    if (fine) {
      dd.addEventListener('pointerenter', () => { clearTimeout(t); t = setTimeout(() => set(true), 80); });
      dd.addEventListener('pointerleave', () => { clearTimeout(t); t = setTimeout(() => set(false), 200); });
    }
    dd.addEventListener('focusout', e => { if (!dd.contains(e.relatedTarget)) set(false); });
  });
  document.addEventListener('click', e => { if (!e.target.closest('.dd')) closeAll(); });

  /* ---------- mobile menu (page pinned underneath) ---------- */
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
  addEventListener('keydown', e => { if (e.key === 'Escape') { if (sheet?.classList.contains('open')) { setMenu(false); menuBtn.focus(); } closeAll(); } });
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

  /* ---------- specialist matcher (tabs) ---------- */
  const tabs = $$('.m-tabs [role="tab"]');
  const pick = tab => {
    tabs.forEach(t => { const on = t === tab; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; $('#' + t.getAttribute('aria-controls')).hidden = !on; });
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => pick(t));
    t.addEventListener('keydown', e => {
      const k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!k) return; e.preventDefault();
      const n = tabs[(i + k + tabs.length) % tabs.length]; pick(n); n.focus();
    });
  });

  /* ---------- reviews carousel ---------- */
  const track = $('.rv-track');
  $$('.rv-b').forEach(b => b.addEventListener('click', () => {
    const card = $('.rv-card', track); const step = card ? card.offsetWidth + 12 : 320;
    track.scrollBy({ left: step * +b.dataset.dir * (innerWidth >= 900 ? 2 : 1), behavior: RM ? 'auto' : 'smooth' });
  }));

  /* ---------- before/after lightbox ---------- */
  const lb = $('#lb');
  $$('.zoom').forEach(z => z.addEventListener('click', () => {
    if (!lb.showModal) { open(z.dataset.full, '_blank'); return; }
    const im = new Image(); im.src = z.dataset.full; im.alt = z.getAttribute('aria-label').replace('Enlarge: ', '');
    $('.lb-i', lb).replaceChildren(im);
    $('p', lb).textContent = z.closest('figure').querySelector('figcaption').textContent;
    lb.showModal();
  }));
  lb?.addEventListener('click', e => { if (e.target === lb || e.target.closest('.lb-x')) lb.close(); });

  /* ---------- booking ---------- */
  const form = $('#bookForm');
  if (form) {
    const daysEl = $('#days'), sessEl = $('#sess');
    let day = null, ses = null;
    const radio = (wrap, btn, cb) => { $$('[role="radio"]', wrap).forEach(b => { b.setAttribute('aria-checked', b === btn); b.tabIndex = b === btn ? 0 : -1; }); cb(); };
    function renderSessions() {
      const d = day ? +day.dataset.dow : 1, isToday = day && day.dataset.today === '1', now = istNow().m;
      /* today: only sessions that haven't ended yet */
      const opts = HOURS[d].map(([a, b], i) => ({ label: i === 0 ? 'Morning' : 'Evening', time: `${fmt(a)} – ${fmt(b)}`, end: mins(b) }))
        .filter(o => !isToday || o.end > now);
      if (d === 0) opts.push({ label: 'Evening', time: 'By appointment' });
      sessEl.innerHTML = opts.map(o => `<button type="button" class="ses" role="radio" aria-checked="false" data-v="${o.label} (${o.time})"><b>${o.label}</b><small>${o.time}</small></button>`).join('');
      ses = null;
      $$('.ses', sessEl).forEach(b => b.addEventListener('click', () => radio(sessEl, b, () => { ses = b; })));
      const first = $('.ses', sessEl); if (first) radio(sessEl, first, () => { ses = first; });
    }
    const { day: today, m } = istNow();
    const base = new Date();
    const chips = [];
    for (let i = 0; chips.length < 8 && i < 14; i++) {
      const dt = new Date(base.getTime() + i * 864e5);
      const dow = (today + i) % 7;
      if (!HOURS[dow].length) continue;
      if (i === 0 && !HOURS[dow].some(([, b]) => mins(b) > m)) continue;   // today already over
      const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : DAYS[dow].slice(0, 3);
      const dateStr = dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
      chips.push(`<button type="button" class="day" role="radio" aria-checked="false" data-dow="${dow}" data-today="${i === 0 ? 1 : 0}" data-v="${DAYS[dow]}, ${dateStr}"><small>${label}</small><b>${dateStr.split(' ')[0]}</b><small>${dateStr.split(' ')[1]}</small></button>`);
    }
    daysEl.innerHTML = chips.join('');
    $$('.day', daysEl).forEach(b => b.addEventListener('click', () => radio(daysEl, b, () => { day = b; renderSessions(); })));
    [daysEl, sessEl].forEach(w => w.addEventListener('keydown', e => {
      const k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (!k) return;
      const items = $$('[role="radio"]', w), i = items.indexOf(document.activeElement); if (i < 0) return;
      e.preventDefault(); const n = items[(i + k + items.length) % items.length]; n.click(); n.focus();
    }));
    const firstDay = $('.day', daysEl); if (firstDay) firstDay.click();

    /* treatment picks its specialist; links can preselect either (?t=PAGE or ?d=id) */
    const tSel = form.treatment, dSel = form.doctor;
    const setDoc = id => { const o = [...dSel.options].find(o => o.dataset.id === id); if (o) dSel.value = o.value; };
    tSel.addEventListener('change', () => { const o = tSel.selectedOptions[0]; if (o.dataset.doc) setDoc(o.dataset.doc); });
    const q = new URLSearchParams(location.search);
    const tp = q.get('t'), dp = q.get('d');
    if (tp) { const o = [...tSel.options].find(o => o.dataset.page === tp); if (o) { tSel.value = o.value; setDoc(o.dataset.doc); } }
    if (dp) setDoc(dp);
    $$('[data-doc]').forEach(a => a.addEventListener('click', () => setDoc(a.dataset.doc)));

    const err = $('#formErr');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const name = form.name.value.trim(), phone = form.phone.value.trim(), okPhone = phone.replace(/\D/g, '').length >= 8;
      form.name.setAttribute('aria-invalid', !name); form.phone.setAttribute('aria-invalid', !okPhone);
      if (!name || !okPhone) { err.textContent = !name ? 'Please add your name.' : 'Please add a phone number we can reach you on.'; (!name ? form.name : form.phone).focus(); return; }
      err.textContent = '';
      const lines = [`Hello, I would like to book an appointment at Dr. Gaur's Dental Clinic.`, `Name: ${name}`, `Phone: ${phone}`,
        `Treatment: ${tSel.value}`, `Specialist: ${dSel.value}`, `Day: ${day ? day.dataset.v : 'Any'}`, `Time: ${ses ? ses.dataset.v : 'Any'}`];
      window.open(`https://wa.me/${WA}?text=` + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
    });
    $$('input', form).forEach(i => i.addEventListener('input', () => i.removeAttribute('aria-invalid')));
  }

  $$('[data-year]').forEach(n => n.textContent = new Date().getFullYear());
})();
