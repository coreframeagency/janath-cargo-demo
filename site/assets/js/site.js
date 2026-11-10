/* Janath Cargo — site behaviour v2
   Language switch, WhatsApp messages, quote form, header, menu, photo slots,
   scroll effects (pinned route map, parallax, scrubbed type, reveals). Reduced-motion aware. */
(() => {
  const WA = '972547415262';
  const root = document.documentElement;
  const SI = window.JC_SI || {};
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

  /* ---------- photo slots ---------- */
  if (/[?&]slots\b/.test(location.search)) root.classList.add('show-slots');
  $$('.ph .photo').forEach((img) => {
    const ok = () => img.closest('.ph').classList.add('has-photo');
    const missing = () => img.remove();
    if (img.complete) (img.naturalWidth ? ok : missing)();
    else { img.addEventListener('load', ok, { once: true }); img.addEventListener('error', missing, { once: true }); }
  });

  /* ---------- language ---------- */
  let lang = 'en';
  const textNodes = $$('[data-i18n]');
  const EN = {}, EN_PH = {}, EN_ARIA = {};
  textNodes.forEach((n) => { if (!(n.dataset.i18n in EN)) EN[n.dataset.i18n] = n.innerHTML; });
  $$('[data-i18n-ph]').forEach((n) => { EN_PH[n.dataset.i18nPh] = n.getAttribute('placeholder'); });
  $$('[data-i18n-aria]').forEach((n) => { EN_ARIA[n.dataset.i18nAria] = n.getAttribute('aria-label'); });
  const TITLE_EN = document.title;
  const waUrl = (text) => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;
  const msg = (k) => (MSG[lang] && MSG[lang][k]) || MSG.en[k] || '';

  function setLang(next, remember) {
    lang = next === 'si' && Object.keys(SI).length ? 'si' : 'en';
    root.lang = lang;
    textNodes.forEach((n) => {
      const v = lang === 'si' ? SI[n.dataset.i18n] : EN[n.dataset.i18n];
      if (v != null && n.innerHTML !== v) n.innerHTML = v;
    });
    $$('[data-i18n-ph]').forEach((n) => { const v = lang === 'si' ? SI[n.dataset.i18nPh] : EN_PH[n.dataset.i18nPh]; if (v != null) n.setAttribute('placeholder', v); });
    $$('[data-i18n-aria]').forEach((n) => { const v = lang === 'si' ? SI[n.dataset.i18nAria] : EN_ARIA[n.dataset.i18nAria]; if (v != null) n.setAttribute('aria-label', v); });
    document.title = lang === 'si' && SI['meta.title'] ? SI['meta.title'] : TITLE_EN;
    $$('[data-lang-toggle] .lang-label').forEach((l) => {
      if (lang === 'si') { l.textContent = 'English'; l.lang = 'en'; } else { l.textContent = 'සිංහල'; l.lang = 'si'; }
    });
    $$('[data-wa]').forEach((a) => { const t = msg(a.dataset.wa); if (t) a.href = waUrl(t); });
    $$('[data-form] input[name="text"]').forEach((h) => { h.value = msg(h.closest('form').dataset.form); });
    if (remember) store.set('jc-lang', lang);
    requestUpdate(true);
  }

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

  /* ---------- header + menu ---------- */
  const head = document.querySelector('[data-head]');
  const menuBtn = head.querySelector('.menu-btn');
  const mnav = document.getElementById('mnav');
  const menuOpen = () => menuBtn.getAttribute('aria-expanded') === 'true';
  const setMenu = (open) => { menuBtn.setAttribute('aria-expanded', String(open)); mnav.hidden = !open; if (open) head.classList.remove('hide'); };
  menuBtn.addEventListener('click', () => setMenu(!menuOpen()));
  mnav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen()) { setMenu(false); menuBtn.focus(); } });
  head.addEventListener('focusin', () => head.classList.remove('hide'));
  $$('[data-quote-link]').forEach((a) => a.addEventListener('click', () => {
    selectTab(tabs[0]);
    setTimeout(() => { const f = document.querySelector('[data-f="from"]'); if (f) f.focus({ preventScroll: true }); }, 500);
  }));
  $$('[data-lang-toggle]').forEach((b) => b.addEventListener('click', () => setLang(lang === 'si' ? 'en' : 'si', true)));

  /* ---------- reveals ---------- */
  const reveals = $$('.rv');
  reveals.forEach((el) => {
    const sibs = Array.from(el.parentElement.children).filter((c) => c.classList.contains('rv'));
    const i = sibs.indexOf(el);
    if (i > 0) el.style.transitionDelay = `${Math.min(i, 5) * 90}ms`;
  });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    reveals.forEach((el) => io.observe(el));
  } else reveals.forEach((el) => el.classList.add('in'));

  /* ---------- route map ---------- */
  const journey = document.querySelector('[data-journey]');
  const svg = journey.querySelector('[data-map]');
  const arc = svg.querySelector('[data-arc]');
  const arcBase = svg.querySelector('[data-arc-base]');
  const arcLen = arc.getTotalLength();
  const M = JSON.parse(svg.dataset.geo);           // {k, lon0, ytop, pts:{israel:[x,y], srilanka:[x,y]}}
  const markers = $$('[data-mk]', journey).map((el) => ({ el, p: M.pts[el.dataset.mk] }));
  const run = journey.querySelector('[data-run]');
  const coords = journey.querySelector('[data-coords]');
  const steps = $$('.step', journey);
  const stepsBox = journey.querySelector('[data-steps]');
  // Focus areas in map units [x0, y0, x1, y1]; each one is fitted into the free part of the screen.
  const FOCUS = [
    [150, 250, 390, 400],     // collection in Israel
    [225, 270, 1205, 860],    // across the route
    [840, 560, 1230, 880],    // arriving
    [1120, 770, 1230, 875],   // Sri Lanka
  ];
  const STATIC_FOCUS = [225, 270, 1205, 860];
  const KEYS = [0.1, 0.38, 0.64, 0.9];
  let pinned = false;
  let staticArc = reduce.matches ? 1 : 0;
  const toCam = (f) => ({ x: (f[0] + f[2]) / 2, y: (f[1] + f[3]) / 2, w: f[2] - f[0], h: f[3] - f[1] });

  function camAt(p) {
    if (p <= KEYS[0]) return toCam(FOCUS[0]);
    if (p >= KEYS[3]) return toCam(FOCUS[3]);
    let i = 0;
    while (p > KEYS[i + 1]) i++;
    const e = smooth((p - KEYS[i]) / (KEYS[i + 1] - KEYS[i]));
    const a = toCam(FOCUS[i]), b = toCam(FOCUS[i + 1]);
    const lg = (u, v) => Math.exp(Math.log(u) + (Math.log(v) - Math.log(u)) * e);
    return { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e, w: lg(a.w, b.w), h: lg(a.h, b.h) };
  }
  const latOf = (y) => (2 * Math.atan(Math.exp(((M.ytop - y) / M.k) * Math.PI / 180)) - Math.PI / 2) * 180 / Math.PI;
  const fmtC = (x, y) => {
    const lat = latOf(y), lon = x / M.k + M.lon0;
    return `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? 'N' : 'S'}  ${lon.toFixed(1)}°E`;
  };

  function drawMap(cam, arcP) {
    const r = svg.getBoundingClientRect();
    const cw = r.width, ch = r.height;
    if (!cw || !ch) return;
    // free stage on screen: right of the text column when pinned, the whole panel otherwise
    const st = pinned
      ? { x: cw * 0.46, y: ch * 0.14, w: cw * 0.5, h: ch * 0.74 }
      : { x: cw * 0.06, y: ch * 0.1, w: cw * 0.88, h: ch * 0.62 };
    const s = Math.min(st.w / cam.w, st.h / cam.h);
    const vw = cw / s, vh = ch / s;
    const vx = cam.x - (st.x + st.w / 2) / s, vy = cam.y - (st.y + st.h / 2) / s;
    svg.setAttribute('viewBox', `${vx.toFixed(2)} ${vy.toFixed(2)} ${vw.toFixed(2)} ${vh.toFixed(2)}`);
    arc.style.strokeWidth = (2.5 / s).toFixed(3);
    arc.style.strokeDasharray = `${(arcLen * arcP).toFixed(2)} ${arcLen.toFixed(2)}`;
    arcBase.style.strokeWidth = (1.5 / s).toFixed(3);
    arcBase.style.strokeDasharray = `${(2 / s).toFixed(2)} ${(9 / s).toFixed(2)}`;
    markers.forEach(({ el, p }) => { el.style.transform = `translate(${((p[0] - vx) * s).toFixed(1)}px, ${((p[1] - vy) * s).toFixed(1)}px)`; });
    const pt = arc.getPointAtLength(arcLen * arcP);
    run.style.transform = `translate(${((pt.x - vx) * s).toFixed(1)}px, ${((pt.y - vy) * s).toFixed(1)}px)`;
    run.style.opacity = arcP > 0.001 && arcP < 0.999 ? '1' : '0';
    coords.textContent = fmtC(cam.x, cam.y);
  }

  function setJourneyMode() {
    pinned = wide.matches && !reduce.matches;
    journey.classList.toggle('static', !pinned);
    if (!pinned) steps.forEach((s) => s.classList.add('on'));
  }
  setJourneyMode();
  if (!pinned && !reduce.matches && 'IntersectionObserver' in window) {
    const mio = new IntersectionObserver((en) => {
      if (!en[0].isIntersecting) return;
      mio.disconnect();
      const t0 = performance.now();
      const tick = (t) => { staticArc = smooth(clamp((t - t0) / 1800, 0, 1)); if (!pinned) drawMap(toCam(STATIC_FOCUS), staticArc); if (staticArc < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }, { threshold: 0.35 });
    mio.observe(svg);
  } else staticArc = 1;

  /* ---------- scroll loop ---------- */
  const parallax = $$('[data-parallax]');
  const scrub = document.querySelector('[data-scrub]');
  let lastY = window.scrollY, ticking = false;

  function update() {
    ticking = false;
    const y = window.scrollY, vh = window.innerHeight;

    if (!menuOpen()) {
      if (y > lastY + 4 && y > 240) head.classList.add('hide');
      else if (y < lastY - 4 || y < 240) head.classList.remove('hide');
    }
    lastY = y;

    if (pinned) {
      const r = journey.getBoundingClientRect();
      const p = clamp(-r.top / (r.height - vh), 0, 1);
      drawMap(camAt(p), clamp((p - KEYS[0]) / (KEYS[2] - KEYS[0]), 0, 1));
      const idx = p < 0.25 ? 0 : p < 0.5 ? 1 : p < 0.75 ? 2 : 3;
      steps.forEach((s, i) => s.classList.toggle('on', i === idx));
      stepsBox.style.setProperty('--p', ((idx + 1) / 4).toFixed(3));
    } else {
      drawMap(toCam(STATIC_FOCUS), staticArc);
    }

    if (!reduce.matches) {
      parallax.forEach((el) => {
        const box = el.parentElement.getBoundingClientRect();
        if (box.bottom < -50 || box.top > vh + 50) return;
        const prog = clamp((vh - box.top) / (vh + box.height), 0, 1);
        el.style.transform = `translate3d(0, ${((prog - 0.5) * parseFloat(el.dataset.parallax) * box.height).toFixed(1)}px, 0)`;
      });
      if (scrub) {
        const band = scrub.parentElement.getBoundingClientRect();
        if (band.bottom > -50 && band.top < vh + 50) {
          // reads left to right: start fully visible as it enters, end fully visible near the top
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

  const fromUrl = new URLSearchParams(location.search).get('lang');
  setLang(fromUrl || store.get('jc-lang') || 'en', Boolean(fromUrl));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => requestUpdate(true));
})();
