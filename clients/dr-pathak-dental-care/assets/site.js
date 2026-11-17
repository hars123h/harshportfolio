/* Dr. Pathak Dental Care · interactions (no libraries) */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement, top = $('#top'), D = window.DPDC || {};
  const store = { get(k){ try { return sessionStorage.getItem(k); } catch(_) { return null; } }, set(k, v){ try { sessionStorage.setItem(k, v); } catch(_) {} } };
  const waLink = text => `https://wa.me/${D.wa}?text=${encodeURIComponent(text)}`;

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

  /* floating WhatsApp button steps aside at the footer and over the tooth chart (both have their own buttons) */
  const fab = $('.wa-fab'), seen = new Set();
  if (fab && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => { es.forEach(en => en.isIntersecting ? seen.add(en.target) : seen.delete(en.target)); fab.classList.toggle('away', seen.size > 0); });
    $$('.f-cta, .pl-chart').forEach(el => io.observe(el));
  }

  /* opening status + day line (IST) */
  const mins = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const fmt = t => { let [h, m] = t.split(':').map(Number); const s = h < 12 ? 'am' : 'pm'; if (h > 12) h -= 12; if (h === 0) h = 12; return m ? `${h}:${String(m).padStart(2, '0')} ${s}` : `${h} ${s}`; };
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
    return { c: '', h: 'Monday to Saturday, 9 am – 9 pm' };
  }
  function paint() {
    const s = status(); $$('[data-status]').forEach(el => { el.classList.remove('open', 'closed', 'soon'); if (s.c) el.classList.add(s.c); $('span', el).innerHTML = s.h; });
    const { day, m } = ist(), open = (D.hours || {})[day];
    $$('[data-day] .day-now').forEach(n => {
      if (!open || m < 540 || m > 1260) { n.hidden = true; return; }
      const p = (m - 540) / 720 * 100; n.hidden = false; n.style.left = p + '%';
      n.classList.toggle('edge-l', p < 12); n.classList.toggle('edge-r', p > 88);
      $('em', n).textContent = 'Now ' + fmt(`${Math.floor(m / 60)}:${m % 60}`);
    });
  }
  paint(); setInterval(paint, 60000);

  /* ---------------- smile planner ---------------- */
  const OPT = {
    implant: { name: 'Dental implants', type: 'Fixed', time: '3–4 months', visits: '3–4 visits', page: 'dental-implants.html' },
    bridge: { name: 'Bridge', type: 'Fixed', time: 'About a week', visits: '2–3 visits', page: 'crowns-bridges.html', d: 'Crowns on the teeth either side hold the false tooth. Best when those teeth need crowns anyway.' },
    cast: { name: 'Cast partial denture', type: 'Removable', time: '2–3 weeks', visits: '4–5 visits', page: 'dentures.html', d: 'A slim, metal-framed plate that clips to your own teeth and fills every gap in the jaw at once.' },
    flipper: { name: 'Removable partial', type: 'Removable', time: 'About a week', visits: '2–3 visits', page: 'dentures.html', d: 'A small plate carrying one tooth. Quick and affordable, and often worn while an implant heals.' },
    fullfixed: { name: 'Fixed teeth on implants', type: 'Fixed', time: 'Planned on a 3D scan', visits: '4–6 visits', page: 'dental-implants.html', d: 'A full set of teeth fixed onto 4–6 implants. It doesn’t come out, and you brush it like natural teeth.' },
    over: { name: 'Implant-retained denture', type: 'Clips in', time: '3–4 months', visits: '4–6 visits', page: 'dentures.html', d: 'A denture that snaps onto 2–4 implants, so it stays put when you eat and talk.' },
    complete: { name: 'Complete or BPS denture', type: 'Removable', time: '3–4 weeks', visits: '5–6 visits', page: 'dentures.html', d: 'A full set on a gum-coloured base. A BPS denture is made with a precise system for a closer fit and firmer bite.' },
  };
  function analyse(order, miss) {
    const idx = order.map((n, i) => miss.has(n) ? i : -1).filter(i => i >= 0), n = idx.length;
    if (!n) return null;
    const runs = []; idx.forEach(i => { const r = runs[runs.length - 1]; if (r && r.e === i - 1) r.e = i; else runs.push({ s: i, e: i }); });
    runs.forEach(r => { r.len = r.e - r.s + 1; r.free = r.s === 0 || r.e === order.length - 1; });
    const front = idx.some(i => order[i] % 10 <= 3), notes = [], opts = [];
    if (n >= 11) {
      notes.push(n === order.length ? 'All teeth are missing in this jaw.' : 'Most teeth are missing in this jaw. The remaining ones are checked to see which are worth keeping.');
      opts.push(['fullfixed', 'Most like natural teeth'], ['over', 'Firm grip, still removable'], ['complete', 'No surgery, lowest cost']);
      return { n, opts, notes };
    }
    const implants = runs.reduce((a, r) => a + (r.len <= 2 ? r.len : Math.ceil(r.len / 2)), 0);
    const bridgeable = runs.length <= 2 && runs.every(r => !r.free && r.len <= 3);
    opts.push(['implant', 'Most like a natural tooth', implants]);
    if (bridgeable) opts.push(['bridge', 'Fixed, no surgery']);
    opts.push(n >= 2 || runs.some(r => r.free) ? ['cast', 'Removable, lowest cost'] : ['flipper', 'Budget, or while you heal']);
    if (runs.some(r => r.free)) notes.push('There’s no tooth behind the gap at the back, so a bridge has nothing to hold on to there.');
    if (runs.some(r => !r.free && r.len > 3)) notes.push('This gap is too long for a bridge to carry safely.');
    if (n === 1 && runs[0].free && order[idx[0]] % 10 === 7) notes.push('A missing last molar is sometimes simply left alone if your bite is stable. Worth asking before you decide.');
    if (front) notes.push('Front teeth are matched to your smile in shape and shade, and a temporary tooth can fill the gap while you heal.');
    return { n, opts, notes };
  }
  $$('[data-planner]').forEach(P => {
    const svg = $('.pl-svg', P), arches = $$('.arch', svg).map(g => $$('.th', g).map(t => +t.dataset.n));
    const teeth = $$('.th', svg), hover = $('.pl-hover', P), empty = $('.pl-empty', P), res = $('.pl-res', P), name = n => D.names[n];
    const miss = new Set();
    const hint = $('.th[data-n="36"]', svg); hint?.classList.add('hint');
    const unhint = () => hint?.classList.remove('hint');
    function render() {
      teeth.forEach(t => t.setAttribute('aria-checked', miss.has(+t.dataset.n)));
      if (!miss.size) { empty.hidden = false; res.hidden = true; return; }
      const all = [...arches[0], ...arches[1]].filter(n => miss.has(n)), N = all.length;
      const list = all.slice(0, 4).map(name).join(', ') + (N > 4 ? `, and ${N - 4} more` : '');
      const msg = `Hello Dr. Pathak, I used the smile planner on your website.\nMissing teeth: ${all.map(n => `${name(n)} (${n})`).join(', ')}.\nI would like to know which option suits me.`;
      const cta = cls => `<a class="btn btn-wa btn-wide pl-cta ${cls}" href="${waLink(msg)}" target="_blank" rel="noopener"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 19.5 5.6 16A8 8 0 1 1 8.4 18.6Z"/><path d="M9 8.6c0 3 2.6 6.2 6 6.6l1.2-1.4-2-1-.9.8c-1.1-.5-2.2-1.5-2.7-2.7l.8-.9-1-2L9 8.6Z"/></svg>Ask Dr. Pathak about ${N === 1 ? 'this tooth' : 'these ' + N + ' teeth'}</a>`;
      let h = `<p class="pl-n"><b>${N}</b> ${N === 1 ? 'tooth' : 'teeth'} marked</p><p class="pl-list">${list}</p>${cta('pl-top')}`;
      ['Upper jaw', 'Lower jaw'].forEach((label, k) => {
        const a = analyse(arches[k], miss); if (!a) return;
        h += `<div class="pl-g"><h3>${label}<span>${a.n} missing</span></h3>${a.notes.map(x => `<p class="pl-why">${x}</p>`).join('')}<ol class="opts">`;
        a.opts.forEach(([key, tag, imp]) => {
          const o = OPT[key];
          const d = key === 'implant' ? (a.n === 1 ? 'A titanium root and a crown fill the gap without touching the teeth beside it.' : 'One implant per tooth, or fewer implants carrying a small bridge where teeth are missing in a row.') : o.d;
          const meta = [o.type, o.visits, o.time].concat(key === 'implant' ? [`about ${imp} implant${imp > 1 ? 's' : ''}`] : []);
          h += `<li class="op"><span class="op-tag">${tag}</span><h4>${o.name}</h4><p>${d}</p><p class="op-meta">${meta.map(x => `<span>${x}</span>`).join('')}</p><a href="${o.page}">How it works <svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a></li>`;
        });
        h += '</ol></div>';
      });
      h += cta('');
      res.innerHTML = h; empty.hidden = true; res.hidden = false;
    }
    const say = t => { const n = +t.dataset.n; hover.innerHTML = `<b>${name(n)}</b> · ${miss.has(n) ? 'marked missing' : 'tap to mark missing'}`; };
    const toggle = t => { const n = +t.dataset.n; miss.has(n) ? miss.delete(n) : miss.add(n); unhint(); $$('.pl-pre .chip', P).forEach(c => c.setAttribute('aria-pressed', 'false')); render(); say(t); };
    svg.addEventListener('click', e => { const t = e.target.closest('.th'); if (t) toggle(t); });
    svg.addEventListener('keydown', e => { const t = e.target.closest('.th'); if (t && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggle(t); } });
    teeth.forEach(t => { t.addEventListener('pointerenter', () => say(t)); t.addEventListener('focus', () => say(t)); });
    $$('.pl-pre .chip', P).forEach(c => c.addEventListener('click', () => {
      miss.clear(); c.dataset.set.split(',').filter(Boolean).forEach(v => miss.add(+v)); unhint();
      $$('.pl-pre .chip', P).forEach(x => x.setAttribute('aria-pressed', x === c && c.dataset.set ? 'true' : 'false'));
      hover.textContent = c.dataset.set ? 'Example loaded. Tap teeth to change it' : 'Tap a tooth to mark it missing'; render();
    }));
    render();
  });

  /* crown materials */
  $$('[data-crown]').forEach(c => $$('.mat', c).forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.m; c.classList.remove('m-pfm', 'm-zr', 'm-emax'); c.classList.add('m-' + k);
    $$('.mat', c).forEach(x => x.setAttribute('aria-pressed', x === b)); $$('.mi', c).forEach(x => x.hidden = x.dataset.for !== k);
  })));

  /* denture tabs */
  $$('[data-tabs]').forEach(w => {
    const tabs = $$('[role="tab"]', w);
    const pick = (t, focus) => { tabs.forEach(x => { const on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; $('#' + x.getAttribute('aria-controls')).hidden = !on; }); if (focus) t.focus(); t.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: RM ? 'auto' : 'smooth' }); };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => pick(t));
      t.addEventListener('keydown', e => { const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (d) { e.preventDefault(); pick(tabs[(i + d + tabs.length) % tabs.length], true); } });
    });
  });

  /* smile playground */
  $$('[data-smile]').forEach(s => {
    const chips = $$('.chip', s), on = new Set();
    const sync = () => { ['w', 'g', 'c', 'v'].forEach(k => s.classList.toggle(k, on.has(k))); chips.forEach(c => c.setAttribute('aria-pressed', on.has(c.dataset.k))); $$('.sm-d li', s).forEach(li => li.classList.toggle('on', on.has(li.dataset.k))); };
    chips.forEach(c => c.addEventListener('click', () => {
      const k = c.dataset.k;
      if (on.has(k)) { on.delete(k); if (k !== 'v') on.delete('v'); }
      else { on.add(k); if (k === 'v') ['w', 'g', 'c'].forEach(x => on.add(x)); }
      sync();
    }));
  });

  /* root canal steps */
  $$('[data-rct]').forEach(r => {
    const btns = $$('.rs button', r), texts = $$('.rs-t', r), next = $('[data-step="1"]', r), prev = $('[data-step="-1"]', r); let cur = 0;
    const go = i => {
      cur = (i + btns.length) % btns.length; r.className = r.className.replace(/\bs\d\b/, 's' + cur);
      btns.forEach((b, j) => b.setAttribute('aria-selected', j === cur)); texts.forEach((t, j) => t.hidden = j !== cur);
      next.firstChild.textContent = cur === btns.length - 1 ? 'Start again ' : 'Next step '; prev.disabled = cur === 0;
    };
    btns.forEach((b, j) => b.addEventListener('click', () => go(j)));
    next.addEventListener('click', () => go(cur + 1)); prev.addEventListener('click', () => go(cur - 1)); go(0);
  });

  /* booking -> WhatsApp */
  const form = $('#bookForm');
  if (form) {
    const today = new Date(Date.now() + 5.5 * 36e5).toISOString().slice(0, 10); form.date.min = today;
    const err = $('#formErr');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const name = form.name.value.trim(), date = form.date.value;
      form.name.setAttribute('aria-invalid', !name); form.date.setAttribute('aria-invalid', !date);
      if (!name || !date) { err.textContent = !name ? 'Please add your name.' : 'Please choose a day.'; (!name ? form.name : form.date).focus(); return; }
      err.textContent = '';
      const day = new Date(date + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
      const lines = ['Hello Dr. Pathak, I would like to book an appointment.', `Name: ${name}`, `For: ${form.treatment.value}`, `Day: ${day}`, `Time: ${form.slot.value}`];
      if (form.msg.value.trim()) lines.push(`Note: ${form.msg.value.trim()}`);
      const url = waLink(lines.join('\n'));
      const a = Object.assign(document.createElement('a'), { href: url, target: '_blank', rel: 'noopener' }); document.body.append(a); a.click(); a.remove();
    });
    $$('input', form).forEach(i => i.addEventListener('input', () => i.removeAttribute('aria-invalid')));
  }

  $$('[data-year]').forEach(n => n.textContent = new Date().getFullYear());
})();
