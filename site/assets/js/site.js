/* Janath Cargo — site behaviour v3
   Route switch (Israel or Philippines to Sri Lanka), language switch, WhatsApp messages, quote form,
   header, menu, photo slots and scroll effects (pinned route map, parallax, scrubbed type, reveals). */
(() => {
  const WA = '972547415262';
  const root = document.documentElement;
  const SI = window.JC_SI || {};
  const EN_PH = window.JC_EN_PH || {};
  const MSG = window.JC_MSG || { en: {}, si: {} };
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (t) => t * t * (3 - 2 * t);
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } },
  };
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const wide = window.matchMedia('(min-width: 1024px)');
  const params = new URLSearchParams(location.search);

  /* ---------- photo slots ---------- */
  $$('.ph .photo').forEach((img) => {
    const ok = () => img.closest('.ph').classList.add('has-photo');
    const missing = () => img.remove();
    if (img.complete) (img.naturalWidth ? ok : missing)();
    else { img.addEventListener('load', ok, { once: true }); img.addEventListener('error', missing, { once: true }); }
  });

  /* ---------- text: language x route ---------- */
  let lang = 'en';
  let route = root.dataset.route === 'ph' ? 'ph' : 'il';
  const textNodes = $$('[data-i18n]');
  const EN = {}, EN_PH_ATTR = {}, EN_ARIA = {};
  textNodes.forEach((n) => { if (!(n.dataset.i18n in EN)) EN[n.dataset.i18n] = n.innerHTML; });
  $$('[data-i18n-ph]').forEach((n) => { EN_PH_ATTR[n.dataset.i18nPh] = n.getAttribute('placeholder'); });
  $$('[data-i18n-aria]').forEach((n) => { EN_ARIA[n.dataset.i18nAria] = n.getAttribute('aria-label'); });
  const TITLE_EN = document.title;

  function text(key, routed) {
    const k = routed && route === 'ph' ? `${key}@ph` : key;
    if (lang === 'si') return SI[k] != null ? SI[k] : SI[key];
    if (routed && route === 'ph' && EN_PH[key] != null) return EN_PH[key];
    return k === key ? EN[key] : EN[key];
  }
  const waUrl = (t) => `https://wa.me/${WA}?text=${encodeURIComponent(t)}`;
  function msg(k) {
    const M = MSG[lang] || MSG.en;
    const t = M[k] || MSG.en[k] || '';
    return t.replace('{from}', M[route === 'ph' ? 'fromPh' : 'fromIl'] || '');
  }

  function render() {
    root.lang = lang;
    root.dataset.route = route;
    textNodes.forEach((n) => {
      const v = text(n.dataset.i18n, n.hasAttribute('data-routed'));
      if (v != null && n.innerHTML !== v) n.innerHTML = v;
    });
    $$('[data-i18n-ph]').forEach((n) => {
      const key = n.dataset.i18nPh, routed = n.hasAttribute('data-routed');
      let v;
      if (lang === 'si') v = (routed && route === 'ph' && SI[`${key}@ph`]) || SI[key];
      else v = routed && route === 'ph' && EN_PH[key] ? EN_PH[key] : EN_PH_ATTR[key];
      if (v != null) n.setAttribute('placeholder', v);
    });
    $$('[data-i18n-aria]').forEach((n) => { const v = lang === 'si' ? SI[n.dataset.i18nAria] : EN_ARIA[n.dataset.i18nAria]; if (v != null) n.setAttribute('aria-label', v); });
    document.title = lang === 'si' && SI['meta.title'] ? SI['meta.title'] : TITLE_EN;
    $$('[data-lang-toggle] .lang-label').forEach((l) => {
      if (lang === 'si') { l.textContent = 'English'; l.lang = 'en'; } else { l.textContent = 'සිංහල'; l.lang = 'si'; }
    });
    $$('[data-route-set]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.routeSet === route)));
    $$('[data-wa]').forEach((a) => { const t = msg(a.dataset.wa); if (t) a.href = waUrl(t); });
    $$('[data-form] input[name="text"]').forEach((h) => { h.value = msg(h.closest('form').dataset.form); });
    $$('[data-src-en]').forEach((img) => { const s = lang === 'si' ? img.dataset.srcSi : img.dataset.srcEn; if (img.getAttribute('src') !== s) img.setAttribute('src', s); });
    const ml = journeyEl.querySelector('[data-mk-label]');
    if (ml) ml.innerHTML = text(route === 'ph' ? 'r.ph' : 'r.il', false) || ml.innerHTML;
    setArc();
    requestUpdate(true);
  }
  function setLang(next, remember) { lang = next === 'si' && Object.keys(SI).length ? 'si' : 'en'; if (remember) store.set('jc-lang', lang); render(); }
  function setRoute(next, remember) { route = next === 'ph' ? 'ph' : 'il'; if (remember) store.set('jc-route', route); render(); }

  /* ---------- quote form ---------- */
  const tabs = $$('[role="tab"]');
  function selectTab(tab, focus) {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(t));
    t.addEventListener('keydown', (e) => {
      const map = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
      if (!(e.key in map)) return;
      e.preventDefault();
      selectTab(tabs[(map[e.key] + tabs.length) % tabs.length], true);
    });
  });
  const now = new Date();
  const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  $$('input[type="date"]').forEach((d) => { d.min = iso; });
  const fmtDate = (v) => {
    if (lang === 'si') return v;
    try { return new Date(`${v}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return v; }
  };
  const openLink = (url) => { const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove(); };
  $$('[data-form]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = (k) => ((form.querySelector(`[data-f="${k}"]`) || {}).value || '').trim();
      const lines = [];
      if (form.dataset.form === 'quote') {
        lines.push(msg('quote'));
        if (val('from')) lines.push(`${msg('lFrom')}: ${val('from')}`);
        if (val('to')) lines.push(`${msg('lTo')}: ${val('to')}`);
        if (val('boxes')) lines.push(`${msg('lBoxes')}: ${val('boxes') === '4+' ? msg('boxes4') : val('boxes')}`);
        if (val('date')) lines.push(`${msg('lDate')}: ${fmtDate(val('date'))}`);
      } else {
        lines.push(msg('update'));
        if (val('ref')) lines.push(`${msg('lRef')}: ${val('ref')}`);
      }
      openLink(waUrl(lines.join('\n')));
    });
  });

  /* ---------- header, menu, route buttons ---------- */
  const head = document.querySelector('[data-head]');
  const menuBtn = head.querySelector('.menu-btn');
  const mnav = document.getElementById('mnav');
  const menuOpen = () => menuBtn.getAttribute('aria-expanded') === 'true';
  const setMenu = (open) => { menuBtn.setAttribute('aria-expanded', String(open)); mnav.hidden = !open; if (open) head.classList.remove('hide'); };
  menuBtn.addEventListener('click', () => setMenu(!menuOpen()));
  mnav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen()) { setMenu(false); menuBtn.focus(); } });
  head.addEventListener('focusin', () => head.classList.remove('hide'));
  const focusQuote = () => {
    selectTab(tabs[0]);
    setTimeout(() => { const f = document.querySelector('[data-f="from"]'); if (f) f.focus({ preventScroll: true }); }, 500);
  };
  $$('[data-quote-link]').forEach((a) => a.addEventListener('click', focusQuote));
  $$('[data-route-go]').forEach((a) => a.addEventListener('click', () => { setRoute(a.dataset.routeGo, true); focusQuote(); }));
  $$('[data-route-set]').forEach((b) => {
    b.addEventListener('click', () => setRoute(b.dataset.routeSet, true));
    b.addEventListener('keydown', (e) => {
      if (!['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
      e.preventDefault();
      const group = $$('[data-route-set]', b.parentElement);
      const next = group[(group.indexOf(b) + 1) % group.length];
      setRoute(next.dataset.routeSet, true); next.focus();
    });
  });
  $$('[data-lang-toggle]').forEach((b) => b.addEventListener('click', () => setLang(lang === 'si' ? 'en' : 'si', true)));
  $$('[data-ig][aria-disabled="true"]').forEach((a) => a.addEventListener('click', (e) => e.preventDefault()));

  /* ---------- reveals ---------- */
  const reveals = $$('.rv');
  reveals.forEach((el) => {
    const sibs = Array.from(el.parentElement.children).filter((c) => c.classList.contains('rv'));
    const i = sibs.indexOf(el);
    if (i > 0) el.style.transitionDelay = `${Math.min(i, 5) * 80}ms`;
  });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    reveals.forEach((el) => io.observe(el));
  } else reveals.forEach((el) => el.classList.add('in'));

  /* ---------- route map ---------- */
  const journeyEl = document.querySelector('[data-journey]');
  const svg = journeyEl.querySelector('[data-map]');
  const M = JSON.parse(svg.dataset.geo);
  const run = journeyEl.querySelector('[data-run]');
  const coords = journeyEl.querySelector('[data-coords]');
  const steps = $$('.step', journeyEl);
  const stepsBox = journeyEl.querySelector('[data-steps]');
  const mkFrom = journeyEl.querySelector('[data-mk="origin"]');
  const mkLk = journeyEl.querySelector('[data-mk="srilanka"]');
  // focus areas in map units [x0, y0, x1, y1], fitted into the free part of the screen
  const FOCUS = {
    il: [[150, 250, 390, 400], [225, 270, 1205, 860], [840, 560, 1230, 880], [1120, 770, 1230, 875]],
    ph: [[1860, 580, 2120, 890], [1130, 560, 2040, 880], [1110, 690, 1400, 880], [1120, 770, 1230, 875]],
  };
  const STATIC_FOCUS = { il: [225, 270, 1205, 860], ph: [1130, 560, 2040, 880] };
  const ORIGIN = { il: M.pts.israel, ph: M.pts.philippines };
  const KEYS = [0.1, 0.38, 0.64, 0.9];
  let arc, arcBase, arcLen = 1;
  function setArc() {
    arc = svg.querySelector(`[data-arc="${route}"]`);
    arcBase = svg.querySelector(`[data-arc-base="${route}"]`);
    arcLen = arc.getTotalLength();
  }
  let pinned = false;
  let staticArc = reduce.matches ? 1 : 0;
  const toCam = (f) => ({ x: (f[0] + f[2]) / 2, y: (f[1] + f[3]) / 2, w: f[2] - f[0], h: f[3] - f[1] });
  function camAt(p) {
    const F = FOCUS[route];
    if (p <= KEYS[0]) return toCam(F[0]);
    if (p >= KEYS[3]) return toCam(F[3]);
    let i = 0;
    while (p > KEYS[i + 1]) i++;
    const e = smooth((p - KEYS[i]) / (KEYS[i + 1] - KEYS[i]));
    const a = toCam(F[i]), b = toCam(F[i + 1]);
    const lg = (u, v) => Math.exp(Math.log(u) + (Math.log(v) - Math.log(u)) * e);
    return { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e, w: lg(a.w, b.w), h: lg(a.h, b.h) };
  }
  const latOf = (y) => (2 * Math.atan(Math.exp(((M.ytop - y) / M.k) * Math.PI / 180)) - Math.PI / 2) * 180 / Math.PI;
  const fmtC = (x, y) => { const lat = latOf(y), lon = x / M.k + M.lon0; return `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? 'N' : 'S'}  ${lon.toFixed(1)}°E`; };

  function drawMap(cam, arcP) {
    const r = svg.getBoundingClientRect();
    const cw = r.width, ch = r.height;
    if (!cw || !ch || !arc) return;
    const st = pinned ? { x: cw * 0.46, y: ch * 0.14, w: cw * 0.5, h: ch * 0.74 } : { x: cw * 0.06, y: ch * 0.1, w: cw * 0.88, h: ch * 0.62 };
    const s = Math.min(st.w / cam.w, st.h / cam.h);
    const vx = cam.x - (st.x + st.w / 2) / s, vy = cam.y - (st.y + st.h / 2) / s;
    svg.setAttribute('viewBox', `${vx.toFixed(2)} ${vy.toFixed(2)} ${(cw / s).toFixed(2)} ${(ch / s).toFixed(2)}`);
    arc.style.strokeWidth = (2.5 / s).toFixed(3);
    arc.style.strokeDasharray = `${(arcLen * arcP).toFixed(2)} ${arcLen.toFixed(2)}`;
    arcBase.style.strokeWidth = (1.5 / s).toFixed(3);
    arcBase.style.strokeDasharray = `${(2 / s).toFixed(2)} ${(9 / s).toFixed(2)}`;
    const place = (el, p) => { el.style.transform = `translate(${((p[0] - vx) * s).toFixed(1)}px, ${((p[1] - vy) * s).toFixed(1)}px)`; };
    place(mkFrom, ORIGIN[route]); place(mkLk, M.pts.srilanka);
    const pt = arc.getPointAtLength(arcLen * arcP);
    place(run, [pt.x, pt.y]);
    run.style.opacity = arcP > 0.001 && arcP < 0.999 ? '1' : '0';
    coords.textContent = fmtC(cam.x, cam.y);
  }
  function setJourneyMode() {
    pinned = wide.matches && !reduce.matches;
    journeyEl.classList.toggle('static', !pinned);
    if (!pinned) steps.forEach((s) => s.classList.add('on'));
  }
  setJourneyMode();
  setArc();
  if (!pinned && !reduce.matches && 'IntersectionObserver' in window) {
    const mio = new IntersectionObserver((en) => {
      if (!en[0].isIntersecting) return;
      mio.disconnect();
      const t0 = performance.now();
      const tick = (t) => { staticArc = smooth(clamp((t - t0) / 1800, 0, 1)); if (!pinned) drawMap(toCam(STATIC_FOCUS[route]), staticArc); if (staticArc < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }, { threshold: 0.35 });
    mio.observe(svg);
  } else staticArc = 1;

  /* ---------- scroll loop ---------- */
  const parallax = $$('[data-parallax]');
  const floaty = $$('[data-parallax-y]');
  const scrub = document.querySelector('[data-scrub]');
  const navLinks = $$('.nav a');
  const sections = navLinks.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  let lastY = window.scrollY, ticking = false;

  function update() {
    ticking = false;
    const y = window.scrollY, vh = window.innerHeight;
    if (!menuOpen()) {
      if (y > lastY + 4 && y > 320) head.classList.add('hide');
      else if (y < lastY - 4 || y < 320) head.classList.remove('hide');
    }
    head.classList.toggle('raised', y > 48);
    lastY = y;

    if (pinned) {
      const r = journeyEl.getBoundingClientRect();
      const p = clamp(-r.top / (r.height - vh), 0, 1);
      drawMap(camAt(p), clamp((p - KEYS[0]) / (KEYS[2] - KEYS[0]), 0, 1));
      const idx = p < 0.25 ? 0 : p < 0.5 ? 1 : p < 0.75 ? 2 : 3;
      steps.forEach((s, i) => s.classList.toggle('on', i === idx));
      stepsBox.style.setProperty('--p', ((idx + 1) / 4).toFixed(3));
    } else {
      drawMap(toCam(STATIC_FOCUS[route]), staticArc);
    }

    let current = null;
    sections.forEach((sec, i) => { const b = sec.getBoundingClientRect(); if (b.top < vh * 0.4 && b.bottom > vh * 0.4) current = i; });
    navLinks.forEach((a, i) => a.classList.toggle('on', i === current));

    if (!reduce.matches) {
      parallax.forEach((el) => {
        const box = el.parentElement.getBoundingClientRect();
        if (box.bottom < -50 || box.top > vh + 50) return;
        const prog = clamp((vh - box.top) / (vh + box.height), 0, 1);
        el.style.transform = `translate3d(0, ${((prog - 0.5) * parseFloat(el.dataset.parallax) * box.height).toFixed(1)}px, 0)`;
      });
      floaty.forEach((el) => {
        const box = el.parentElement.getBoundingClientRect();
        if (box.bottom < -50 || box.top > vh + 50) return;
        const prog = clamp((vh - box.top) / (vh + box.height), 0, 1);
        el.style.transform = `translate3d(0, ${((prog - 0.5) * parseFloat(el.dataset.parallaxY) * vh).toFixed(1)}px, 0)`;
      });
      if (scrub) {
        const band = scrub.parentElement.getBoundingClientRect();
        if (band.bottom > -50 && band.top < vh + 50) {
          const prog = smooth(clamp((vh * 0.9 - band.top) / (vh * 0.75), 0, 1));
          const dist = Math.max(0, scrub.scrollWidth - band.width);
          scrub.style.transform = `translate3d(${(-dist * prog).toFixed(1)}px, 0, 0)`;
        }
      }
    }
  }
  function requestUpdate(force) {
    if (force) { update(); return; }
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }
  window.addEventListener('scroll', () => requestUpdate(), { passive: true });
  window.addEventListener('resize', () => requestUpdate(true));
  const onMode = () => { setJourneyMode(); requestUpdate(true); };
  wide.addEventListener('change', onMode);
  reduce.addEventListener('change', onMode);

  const urlLang = params.get('lang'), urlRoute = params.get('from');
  lang = (urlLang || store.get('jc-lang')) === 'si' && Object.keys(SI).length ? 'si' : 'en';
  route = (urlRoute || store.get('jc-route')) === 'ph' ? 'ph' : 'il';
  if (urlLang) store.set('jc-lang', lang);
  if (urlRoute) store.set('jc-route', route);
  render();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => requestUpdate(true));
})();
