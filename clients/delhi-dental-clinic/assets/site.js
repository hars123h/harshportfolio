/* The Delhi Dental Clinic · site behaviour (no libraries) */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const root = document.documentElement;
  const top = $('#top');
  const store = {
    get(k){ try { return sessionStorage.getItem(k); } catch(_) { return null; } },
    set(k, v){ try { sessionStorage.setItem(k, v); } catch(_) {} }
  };

  /* fixed top bar: keep the page offset equal to its real height */
  const setH = () => root.style.setProperty('--hh', top.offsetHeight + 'px');
  const ribbon = $('#ribbon');
  if (ribbon && store.get('rb-hide')) ribbon.remove();
  $('.rb-x')?.addEventListener('click', () => { store.set('rb-hide', '1'); $('#ribbon')?.remove(); setH(); });
  setH();
  if (window.ResizeObserver) new ResizeObserver(setH).observe(top); else addEventListener('resize', setH);

  /* scrolled state */
  const onScroll = () => { if (!locked) top.classList.toggle('scrolled', scrollY > 8); };
  addEventListener('scroll', onScroll, { passive: true });

  /* ---------- desktop mega menu ---------- */
  const megaBtn = $('.nav-t'), mega = $('#mega');
  let megaT;
  const setMega = open => { mega.classList.toggle('open', open); megaBtn.setAttribute('aria-expanded', open); };
  if (megaBtn && mega) {
    megaBtn.addEventListener('click', () => setMega(megaBtn.getAttribute('aria-expanded') !== 'true'));
    if (fine) {
      const enter = () => { clearTimeout(megaT); megaT = setTimeout(() => setMega(true), 90); };
      const leave = () => { clearTimeout(megaT); megaT = setTimeout(() => setMega(false), 220); };
      [megaBtn, mega].forEach(el => { el.addEventListener('pointerenter', enter); el.addEventListener('pointerleave', leave); });
    }
    document.addEventListener('click', e => { if (!e.target.closest('.nav-t, #mega')) setMega(false); });
    mega.addEventListener('focusout', e => { if (!mega.contains(e.relatedTarget) && e.relatedTarget !== megaBtn) setMega(false); });
  }

  /* ---------- mobile menu sheet (page pinned underneath; iOS ignores overflow:hidden) ---------- */
  const sheet = $('#sheet'), menuBtn = $('.menu-btn');
  let locked = false, lockY = 0;
  function lock(on) {
    const b = document.body.style;
    if (on && !locked) {
      locked = true; lockY = scrollY;
      Object.assign(b, { position: 'fixed', top: -lockY + 'px', left: '0', right: '0', width: '100%' });
    } else if (!on && locked) {
      Object.assign(b, { position: '', top: '', left: '', right: '', width: '' });
      scrollTo({ top: lockY, behavior: 'instant' });
      locked = false;
    }
  }
  function setMenu(open) {
    if (!sheet) return;
    sheet.classList.toggle('open', open);
    sheet.setAttribute('aria-hidden', open ? 'false' : 'true');
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    root.classList.toggle('menu-open', open);
    lock(open);
  }
  menuBtn?.addEventListener('click', () => setMenu(!sheet.classList.contains('open')));
  sheet?.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (sheet?.classList.contains('open')) { setMenu(false); menuBtn.focus(); }
    if (mega?.classList.contains('open')) { setMega(false); megaBtn.focus(); }
  });
  matchMedia('(min-width:1080px)').addEventListener?.('change', m => { if (m.matches) setMenu(false); });

  /* ---------- reveal on scroll ---------- */
  const rv = $$('.rv');
  if (!RM && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      const sib = [...el.parentElement.children].filter(c => c.classList.contains('rv'));
      el.style.transitionDelay = Math.min(sib.indexOf(el), 4) * 70 + 'ms';
      el.classList.add('shown'); io.unobserve(el);
      el.addEventListener('transitionend', () => { el.style.transitionDelay = ''; }, { once: true });
    }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    rv.forEach(el => io.observe(el));
  } else rv.forEach(el => el.classList.add('shown'));

  /* ---------- concern chooser (home: picks; treatments page: filter) ---------- */
  $$('.chips[role="group"]').forEach(group => {
    const list = group.closest('section').querySelector('.picks') || $('#allT');
    if (!list) return;
    const cards = $$(':scope > a', list);
    const apply = k => {
      let n = 0;
      cards.forEach(c => {
        const on = k === 'all' || (c.dataset.c || '').split(' ').includes(k);
        c.hidden = !on;
        if (on && list.classList.contains('picks')) { c.classList.remove('show'); void c.offsetWidth; c.style.animationDelay = (n++ * 60) + 'ms'; c.classList.add('show'); }
      });
    };
    $$('button.chip', group).forEach(b => b.addEventListener('click', () => {
      $$('button.chip', group).forEach(x => x.setAttribute('aria-pressed', x === b));
      apply(b.dataset.k);
    }));
    const first = $('button.chip[aria-pressed="true"]', group);
    if (first) apply(first.dataset.k);
  });

  /* ---------- clinic tour: plays muted while on screen ---------- */
  const tour = $('#tour'), tb = $('.tour-btn');
  if (tour) {
    let userPaused = RM;
    const sync = () => { tb.classList.toggle('playing', !tour.paused); tb.setAttribute('aria-label', tour.paused ? 'Play the clinic video' : 'Pause the clinic video'); };
    tour.addEventListener('play', sync); tour.addEventListener('pause', sync);
    tb.addEventListener('click', () => { if (tour.paused) { userPaused = false; tour.play().catch(() => {}); } else { userPaused = true; tour.pause(); } });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => {
        if (en.isIntersecting && !userPaused) { tour.preload = 'auto'; tour.play().catch(() => {}); }
        else if (!en.isIntersecting) tour.pause();
      }, { threshold: .35 }).observe(tour);
    }
    sync();
  }

  /* ---------- patient video: loads only when asked ---------- */
  $$('.vframe').forEach(f => {
    $('.vplay', f).addEventListener('click', () => {
      const v = document.createElement('video');
      v.src = f.dataset.video; v.controls = true; v.playsInline = true; v.autoplay = true;
      v.setAttribute('playsinline', ''); v.poster = $('img', f).currentSrc || $('img', f).src;
      f.replaceChildren(v);
      v.play().catch(() => {});
    });
  });

  /* ---------- booking form -> WhatsApp ---------- */
  const form = $('#bookForm');
  if (form) {
    /* treatment pages link here with ?t=<slug>, so the right treatment is already chosen */
    const t = new URLSearchParams(location.search).get('t');
    const opt = t && [...form.treatment.options].find(o => o.dataset.slug === t);
    if (opt) form.treatment.value = opt.value;
    const err = $('#formErr');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const name = form.name.value.trim(), phone = form.phone.value.trim();
      form.name.setAttribute('aria-invalid', !name); form.phone.setAttribute('aria-invalid', phone.replace(/\D/g, '').length < 8);
      if (!name || phone.replace(/\D/g, '').length < 8) {
        err.textContent = !name ? 'Please add your name.' : 'Please add a phone number we can call back.';
        (!name ? form.name : form.phone).focus();
        return;
      }
      err.textContent = '';
      const lines = [
        'Hello, I would like to book an appointment at The Delhi Dental Clinic.',
        `Name: ${name}`, `Phone: ${phone}`, `Treatment: ${form.treatment.value}`, `Preferred time: ${form.time.value}`
      ];
      if (form.msg.value.trim()) lines.push(`Note: ${form.msg.value.trim()}`);
      window.open('https://wa.me/919810106117?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
    });
    $$('input', form).forEach(i => i.addEventListener('input', () => i.removeAttribute('aria-invalid')));
  }

  /* footer year */
  $$('[data-year]').forEach(n => n.textContent = new Date().getFullYear());
})();
