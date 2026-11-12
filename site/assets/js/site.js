/* Janath Cargo — site behaviour v3
   Route switch (Israel → Sri Lanka or Israel → Philippines), language switch, WhatsApp and call desks,
   header, menu, photo slots and scroll effects (pinned route map, doorstep, parallax, scrubbed type, reveals,
   smooth wheel scrolling). */
(() => {
  const WA = '972547415262';
  // WhatsApp and phone desks: Israel → Sri Lanka and Israel → Philippines each have their own numbers
  const DESK = { il: '972547415262', ph: '972545825163' };
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

  /* photo variants: a tall crop for portrait screens and a Philippines version, each used only when its file exists */
  const portraitMQ = window.matchMedia('(max-aspect-ratio: 4/5)');
  const probes = {};
  const exists = (src) => probes[src] || (probes[src] = new Promise((res) => { const t = new Image(); t.onload = () => res(true); t.onerror = () => res(false); t.src = src; }));
  const variantImgs = $$('img[data-tall], img[data-ph-src]');
  variantImgs.forEach((img) => { img.dataset.wide = img.getAttribute('src'); });
  async function applyVariants() {
    for (const img of variantImgs) {
      if (!img.isConnected) continue;
      const portrait = portraitMQ.matches, d = img.dataset, list = [];
      if (route === 'ph') { if (portrait && d.phTall) list.push([d.phTall, true]); if (d.phSrc) list.push([d.phSrc, false]); }
      if (portrait && d.tall) list.push([d.tall, true]);
      for (const [src, tall] of list.concat([[d.wide, false]])) {
        if (src === d.wide || await exists(src)) {
          if (img.getAttribute('src') !== src) img.src = src;
          img.closest('.ph').classList.toggle('is-tall', tall);
          break;
        }
      }
    }
  }
  portraitMQ.addEventListener('change', () => applyVariants());

  /* ---------- text: language x route ---------- */
  let lang = 'en';
  let route = root.dataset.route === 'ph' ? 'ph' : 'il';
  const textNodes = $$('[data-i18n]');
  const EN = {}, EN_PH_ATTR = {}, EN_ARIA = {}, EN_ALT = {};
  textNodes.forEach((n) => { if (!(n.dataset.i18n in EN)) EN[n.dataset.i18n] = n.innerHTML; });
  $$('[data-i18n-ph]').forEach((n) => { EN_PH_ATTR[n.dataset.i18nPh] = n.getAttribute('placeholder'); });
  $$('[data-i18n-aria]').forEach((n) => { EN_ARIA[n.dataset.i18nAria] = n.getAttribute('aria-label'); });
  $$('[data-i18n-alt]').forEach((n) => { EN_ALT[n.dataset.i18nAlt] = n.getAttribute('alt'); });
  const TITLE_EN = document.title;

  function text(key, routed) {
    const k = routed && route === 'ph' ? `${key}@ph` : key;
    if (lang === 'si') return SI[k] != null ? SI[k] : SI[key];
    if (routed && route === 'ph' && EN_PH[key] != null) return EN_PH[key];
    return k === key ? EN[key] : EN[key];
  }
  const waUrl = (t, num) => `https://wa.me/${num || DESK[route] || WA}?text=${encodeURIComponent(t)}`;
  function msg(k) {
    const M = MSG[lang] || MSG.en;
    const t = M[k] || MSG.en[k] || '';
    return t.replace('{to}', M[route === 'ph' ? 'toPh' : 'toIl'] || '');
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
    $$('[data-i18n-alt]').forEach((n) => { const v = lang === 'si' ? SI[n.dataset.i18nAlt] : EN_ALT[n.dataset.i18nAlt]; if (v != null) n.setAttribute('alt', v); });
    document.title = lang === 'si' && SI['meta.title'] ? SI['meta.title'] : TITLE_EN;
    $$('[data-lang-toggle] .lang-label').forEach((l) => {
      if (lang === 'si') { l.textContent = 'English'; l.lang = 'en'; } else { l.textContent = 'සිංහල'; l.lang = 'si'; }
    });
    $$('[data-route-set]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.routeSet === route)));
    $$('[data-wa]').forEach((a) => { const t = msg(a.dataset.wa); if (t) a.href = waUrl(t, a.dataset.waNum); });
    $$('[data-src-en]').forEach((img) => { const s = lang === 'si' ? img.dataset.srcSi : img.dataset.srcEn; if (img.getAttribute('src') !== s) img.setAttribute('src', s); });
    const ml = journeyEl.querySelector('[data-mk-label]');
    if (ml) ml.innerHTML = text(route === 'ph' ? 'r.ph' : 'r.lk', false) || ml.innerHTML;
    applyVariants();
    setJourneyMode();
    setArc();
    measure();
    requestUpdate(true);
  }
  function setLang(next, remember) { lang = next === 'si' && Object.keys(SI).length ? 'si' : 'en'; if (remember) store.set('jc-lang', lang); render(); }
  function setRoute(next, remember) { route = next === 'ph' ? 'ph' : 'il'; if (remember) store.set('jc-route', route); render(); }

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
  // "Call or WhatsApp" links scroll to the contact card and put focus on the current desk's first WhatsApp button
  const focusQuote = () => {
    setTimeout(() => { const f = document.querySelector(`[data-desk="${route}"] [data-wa]`); if (f) f.focus({ preventScroll: true }); }, 500);
  };
  $$('[data-quote-link]').forEach((a) => a.addEventListener('click', focusQuote));
  // "Sign up" links land on the form with the name field ready
  $$('[data-signup-link]').forEach((a) => a.addEventListener('click', () => setTimeout(() => { const f = document.querySelector('[data-signup] [name="name"]'); if (f && f.offsetParent) f.focus({ preventScroll: true }); }, 600)));
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

  /* ---------- updates sign-up ---------- */
  // Posts to the Janath Cargo API (server/), which saves the sign-up and sends the welcome email.
  const upForm = document.querySelector('[data-signup]');
  if (upForm) {
    const upDone = document.querySelector('[data-up-done]');
    const upErr = upForm.querySelector('[data-up-err]');
    const upBtn = upForm.querySelector('button[type="submit"]');
    const upBtnText = upBtn.querySelector('span');
    const msg = (k, vars = {}) => {
      const el = document.querySelector(`[data-up-msg="${k}"]`);
      return (el ? el.textContent : '').replace(/\{(\w+)\}/g, (_, v) => vars[v] || '');
    };
    const PH = { IL: '+972 50 123 4567', LK: '+94 77 123 4567', PH: '+63 917 123 4567' };
    const DIAL = { IL: '+972 ', LK: '+94 ', PH: '+63 ' };
    const f = (n) => upForm.elements[n];
    f('country').addEventListener('change', () => {
      const c = f('country').value, ph = f('phone');
      ph.placeholder = PH[c] || PH.IL;
      if (!ph.value.trim() || Object.values(DIAL).includes(ph.value)) ph.value = DIAL[c] || '';
    });
    const EMAIL_RE = /^[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[a-z]{2,}$/i;
    function check() {
      const bad = [];
      if (f('name').value.trim().length < 2) bad.push('name');
      if (!EMAIL_RE.test(f('email').value.trim())) bad.push('email');
      if (!f('country').value) bad.push('country');
      if (f('phone').value.replace(/\D/g, '').length < 7) bad.push('phone');
      return bad;
    }
    function showErrors(bad) {
      ['name', 'email', 'country', 'phone'].forEach((n) => f(n).setAttribute('aria-invalid', bad.includes(n) ? 'true' : 'false'));
      upErr.hidden = !bad.length;
      upErr.textContent = bad.length ? msg(bad[0]) : '';
      if (bad.length) f(bad[0]).focus();
    }
    ['name', 'email', 'country', 'phone'].forEach((n) => f(n).addEventListener('input', () => { if (f(n).getAttribute('aria-invalid') === 'true') f(n).setAttribute('aria-invalid', 'false'); }));
    upForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const bad = check();
      if (bad.length) return showErrors(bad);
      showErrors([]);
      const label = upBtnText.textContent;
      upBtn.disabled = true; upBtn.setAttribute('aria-busy', 'true'); upBtnText.textContent = msg('sending');
      const body = { name: f('name').value.trim(), email: f('email').value.trim(), country: f('country').value, phone: f('phone').value.trim(), company: f('company').value, lang, route };
      try {
        const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 60000); // the API may take a moment to wake up
        const r = await fetch(`${upForm.dataset.api}/api/subscribe`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctl.signal });
        clearTimeout(tm);
        const d = await r.json().catch(() => ({}));
        if (r.status === 422 && d.fields) { showErrors(Object.keys(d.fields)); return; }
        if (!r.ok || !d.ok) throw new Error('failed');
        const vars = { name: d.name || body.name.split(' ')[0], email: body.email };
        upDone.querySelector('[data-up-title]').textContent = msg(d.already ? 'already' : 'thanks', vars);
        upDone.querySelector('[data-up-text]').textContent = msg(d.already ? 'alreadyP' : 'thanksP', vars);
        upForm.hidden = true; upDone.hidden = false; upDone.focus();
      } catch (err) {
        upErr.hidden = false; upErr.textContent = msg('fail');
      } finally {
        upBtn.disabled = false; upBtn.removeAttribute('aria-busy'); upBtnText.textContent = label;
      }
    });
  }

  /* ---------- route map ---------- */
  const journeyEl = document.querySelector('[data-journey]');
  const svg = journeyEl.querySelector('[data-map]');
  const M = JSON.parse(svg.dataset.geo);
  const run = journeyEl.querySelector('[data-run]');
  const coords = journeyEl.querySelector('[data-coords]');
  const steps = $$('.step', journeyEl);
  const stepsBox = journeyEl.querySelector('[data-steps]');
  const mkFrom = journeyEl.querySelector('[data-mk="origin"]');
  const mkTo = journeyEl.querySelector('[data-mk="dest"]');
  // focus areas in map units [x0, y0, x1, y1], fitted into the free part of the screen
  const FOCUS = {
    il: [[150, 250, 390, 400], [225, 270, 1205, 860], [840, 560, 1230, 880], [1120, 770, 1230, 875]],
    ph: [[150, 250, 390, 400], [180, 180, 2060, 800], [1640, 520, 2100, 840], [1880, 590, 2080, 780]],
  };
  const STATIC_FOCUS = { il: [225, 270, 1205, 860], ph: [180, 180, 2060, 800] };
  const DEST = { il: M.pts.srilanka, ph: M.pts.philippines };
  const KEYS = [0.1, 0.38, 0.64, 0.9];
  // Layout is measured on load, resize and content changes, never inside the scroll loop.
  const G = { vh: window.innerHeight, svgW: 0, svgH: 0, j: { top: 0, h: 0 }, m: null, secs: [], par: [], fl: [], band: null };
  const docTop = (el) => { let t = 0; for (let n = el; n; n = n.offsetParent) t += n.offsetTop; return t; };
  let arc, arcBase, arcLen = 1, lastMap = '', stepIdx = -1;
  function setArc() {
    arc = svg.querySelector(`[data-arc="${route}"]`);
    arcBase = svg.querySelector(`[data-arc-base="${route}"]`);
    arcLen = arc.getTotalLength();
    lastMap = '';
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
    const cw = G.svgW, ch = G.svgH;
    if (!cw || !ch || !arc) return;
    const st = pinned ? { x: cw * 0.46, y: ch * 0.14, w: cw * 0.5, h: ch * 0.74 } : { x: cw * 0.06, y: ch * 0.1, w: cw * 0.88, h: ch * 0.62 };
    const s = Math.min(st.w / cam.w, st.h / cam.h);
    const vx = cam.x - (st.x + st.w / 2) / s, vy = cam.y - (st.y + st.h / 2) / s;
    const vb = `${vx.toFixed(2)} ${vy.toFixed(2)} ${(cw / s).toFixed(2)} ${(ch / s).toFixed(2)}`;
    const key = `${vb} ${arcP.toFixed(4)}`;
    if (key === lastMap) return;                                     // nothing moved: skip the repaint
    lastMap = key;
    svg.setAttribute('viewBox', vb);
    arc.style.strokeWidth = (2.5 / s).toFixed(3);
    arc.style.strokeDasharray = `${(arcLen * arcP).toFixed(2)} ${arcLen.toFixed(2)}`;
    arcBase.style.strokeWidth = (1.5 / s).toFixed(3);
    arcBase.style.strokeDasharray = `${(2 / s).toFixed(2)} ${(9 / s).toFixed(2)}`;
    const place = (el, p) => { el.style.transform = `translate(${((p[0] - vx) * s).toFixed(1)}px, ${((p[1] - vy) * s).toFixed(1)}px)`; };
    place(mkFrom, M.pts.israel); place(mkTo, DEST[route]);
    const pt = arc.getPointAtLength(arcLen * arcP);
    place(run, [pt.x, pt.y]);
    run.style.opacity = arcP > 0.001 && arcP < 0.999 ? '1' : '0';
    const c = fmtC(cam.x, cam.y);
    if (coords.textContent !== c) coords.textContent = c;
  }
  // The scroll animation runs for Israel → Sri Lanka only; Israel → Philippines shows a still map.
  function setJourneyMode() {
    pinned = wide.matches && !reduce.matches && route === 'il';
    journeyEl.classList.toggle('static', !pinned);
    if (!pinned) steps.forEach((s) => s.classList.add('on'));
    lastMap = ''; stepIdx = -1;
  }
  setJourneyMode();
  setArc();
  if (!pinned && !reduce.matches && 'IntersectionObserver' in window) {
    const mio = new IntersectionObserver((en) => {
      if (!en[0].isIntersecting) return;
      mio.disconnect();
      const t0 = performance.now();
      const tick = (t) => { staticArc = smooth(clamp((t - t0) / 1800, 0, 1)); if (!pinned) drawMap(toCam(STATIC_FOCUS[route]), route === 'ph' ? 1 : staticArc); if (staticArc < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }, { threshold: 0.35 });
    mio.observe(svg);
  } else staticArc = 1;

  /* ---------- the doorstep: framed photo opens to full screen while pinned ---------- */
  const moment = document.querySelector('[data-moment]');
  let momentLive = false;
  const mVals = {};
  const setVar = (k, v) => { if (mVals[k] !== v) { mVals[k] = v; moment.style.setProperty(k, v); } };
  function setMomentMode() {
    if (!moment) return;
    momentLive = !reduce.matches;
    moment.classList.toggle('live', momentLive);
    if (!momentLive) ['--mi-x', '--mi-y', '--mi-r', '--ms', '--mt-o', '--mt-y'].forEach((v) => { moment.style.removeProperty(v); delete mVals[v]; });
  }
  function drawMoment(y) {
    if (!momentLive || !G.m) return;
    const vh = G.vh, top = G.m.top - y, h = G.m.h;
    if (top + h < -100 || top > vh + 100) return;
    const vw = G.m.w;
    const enter = clamp((vh - top) / vh, 0, 1);                      // section rising into view
    const pin = clamp(-top / Math.max(1, h - vh), 0, 1);             // pinned progress
    const open = smooth(clamp(pin / 0.55, 0, 1));                    // 0 framed, 1 full screen
    const narrow = vw < 761;
    const maxX = narrow ? 16 : Math.max(24, (vw - 1200) / 2);        // starts at the content width
    const maxY = vh * (narrow ? 0.07 : 0.1);
    setVar('--mi-x', `${(maxX * (1 - open)).toFixed(1)}px`);
    setVar('--mi-y', `${(maxY * (1 - open)).toFixed(1)}px`);
    setVar('--mi-r', `${(12 * (1 - open)).toFixed(1)}px`);
    setVar('--ms', (1.16 - 0.06 * enter - 0.1 * open).toFixed(4));
    const t = smooth(clamp((pin - 0.42) / 0.33, 0, 1));
    setVar('--mt-o', t.toFixed(3));
    setVar('--mt-y', `${(32 * (1 - t)).toFixed(1)}px`);
  }
  setMomentMode();

  /* ---------- scroll loop ---------- */
  const parallax = $$('[data-parallax]');
  const floaty = $$('[data-parallax-y]');
  const scrub = document.querySelector('[data-scrub]');
  const navLinks = $$('.nav a');
  const sections = navLinks.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  parallax.forEach((el) => el.style.setProperty('--pf', el.dataset.parallax));
  floaty.forEach((el) => el.style.setProperty('--pfy', el.dataset.parallaxY));

  // Where the browser supports scroll-driven animations, parallax and the sliding headline run in CSS on the
  // compositor (html.sda in site.css), so they stay locked to the page however it is scrolled.
  const sdaOK = !!(window.CSS && CSS.supports && CSS.supports('animation-timeline', '--t') && CSS.supports('view-timeline-name', '--t') && CSS.supports('width', '1cqw'));
  let sda = false;
  function setSda() {
    sda = sdaOK && !reduce.matches;
    root.classList.toggle('sda', sda);
    if (sda || reduce.matches) parallax.concat(floaty, scrub ? [scrub] : []).forEach((el) => el.style.removeProperty('transform'));
  }

  function measure() {
    G.vh = window.innerHeight;
    const sr = svg.getBoundingClientRect();
    G.svgW = sr.width; G.svgH = sr.height;
    G.j = { top: docTop(journeyEl), h: journeyEl.offsetHeight };
    G.m = moment ? { top: docTop(moment), h: moment.offsetHeight, w: moment.clientWidth } : null;
    G.secs = sections.map((s) => { const t = docTop(s); return [t, t + s.offsetHeight]; });
    const box = (el, f) => { const p = el.parentElement; return { el, f: parseFloat(f) || 0, top: docTop(p), h: p.offsetHeight, last: '' }; };
    G.par = parallax.map((el) => box(el, el.dataset.parallax));
    G.fl = floaty.map((el) => box(el, el.dataset.parallaxY));
    if (scrub) { const b = scrub.parentElement; G.band = { el: scrub, top: docTop(b), h: b.offsetHeight, dist: Math.max(0, scrub.scrollWidth - b.clientWidth), last: '' }; }
    lastMap = '';
    needDraw = true;
  }

  let lastY = window.scrollY, drawnY = NaN, needDraw = true, ticking = false, navOn = -2;
  const put = (it, v) => { if (it.last !== v) { it.last = v; it.el.style.transform = v; } };
  const near = (top, h, vh, m) => top + h > -m && top < vh + m;

  // Reads only scrollY and the cached layout, then writes; nothing here forces the browser to lay out the page.
  function update() {
    ticking = false;
    const y = window.scrollY, vh = G.vh;
    if (y === drawnY && !needDraw) return;
    const full = needDraw;
    needDraw = false; drawnY = y;

    if (!menuOpen()) {
      if (y > lastY + 4 && y > 320) head.classList.add('hide');
      else if (y < lastY - 4 || y < 320) head.classList.remove('hide');
    }
    head.classList.toggle('raised', y > 48);
    lastY = y;

    const jt = G.j.top - y;
    if (pinned) {
      const p = clamp(-jt / Math.max(1, G.j.h - vh), 0, 1);
      if (near(jt, G.j.h, vh, 200)) drawMap(camAt(p), clamp((p - KEYS[0]) / (KEYS[2] - KEYS[0]), 0, 1));
      const idx = p < 0.25 ? 0 : p < 0.5 ? 1 : p < 0.75 ? 2 : 3;
      if (idx !== stepIdx) {
        stepIdx = idx;
        steps.forEach((s, i) => s.classList.toggle('on', i === idx));
        stepsBox.style.setProperty('--p', ((idx + 1) / 4).toFixed(3));
      }
    } else if (full) {
      drawMap(toCam(STATIC_FOCUS[route]), route === 'ph' ? 1 : staticArc);
    }
    drawMoment(y);

    const mid = y + vh * 0.4;
    let cur = -1;
    G.secs.forEach(([t, b], i) => { if (t < mid && b > mid) cur = i; });
    if (cur !== navOn) { navOn = cur; navLinks.forEach((a, i) => a.classList.toggle('on', i === cur)); }

    if (!reduce.matches && !sda) {
      G.par.forEach((it) => {
        const top = it.top - y;
        if (!near(top, it.h, vh, 50)) return;
        const prog = clamp((vh - top) / (vh + it.h), 0, 1);
        put(it, `translate3d(0, ${((prog - 0.5) * it.f * it.h).toFixed(1)}px, 0)`);
      });
      G.fl.forEach((it) => {
        const top = it.top - y;
        if (!near(top, it.h, vh, 50)) return;
        const prog = clamp((vh - top) / (vh + it.h), 0, 1);
        put(it, `translate3d(0, ${((prog - 0.5) * it.f * vh).toFixed(1)}px, 0)`);
      });
      const b = G.band;
      if (b && near(b.top - y, b.h, vh, 50)) {
        const prog = smooth(clamp((vh * 0.9 - (b.top - y)) / (vh * 0.75), 0, 1));
        put(b, `translate3d(${(-b.dist * prog).toFixed(1)}px, 0, 0)`);
      }
    }
  }
  function requestUpdate(now) {
    if (now === true) { needDraw = true; update(); return; }
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }
  const remeasure = () => { measure(); requestUpdate(); };
  window.addEventListener('scroll', () => requestUpdate(), { passive: true });
  window.addEventListener('resize', () => { measure(); requestUpdate(true); });
  window.addEventListener('load', remeasure);
  if ('ResizeObserver' in window) new ResizeObserver(remeasure).observe(document.body);

  /* ---------- smooth wheel scrolling ---------- */
  // Mouse-wheel and trackpad input eases toward its target, and every scroll effect is drawn in the same frame,
  // so pinned scenes and parallax glide instead of stepping. Touch, keyboard, scrollbar, links and
  // find-in-page keep the browser's own scrolling; reduced motion turns this off.
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const LERP = 0.13, LINE = 33;
  const ease = { on: false, active: false, cur: 0, target: 0, t: 0, raf: 0 };
  function nestedScroll(node, dy) {
    for (let n = node; n && n.nodeType === 1 && n !== document.body && n !== root; n = n.parentElement) {
      if (n.scrollHeight <= n.clientHeight + 1) continue;
      const oy = getComputedStyle(n).overflowY;
      if (oy !== 'auto' && oy !== 'scroll') continue;
      if (dy < 0 ? n.scrollTop > 0 : n.scrollTop + n.clientHeight < n.scrollHeight - 1) return true;
    }
    return false;
  }
  function easeStop() {
    if (!ease.active) return;
    ease.active = false;
    cancelAnimationFrame(ease.raf);
    root.style.removeProperty('scroll-behavior');
  }
  function easeStep(t) {
    const dt = ease.t ? clamp(t - ease.t, 1, 50) : 16.67;
    ease.t = t;
    ease.cur += (ease.target - ease.cur) * (1 - Math.pow(1 - LERP, dt / 16.67));
    const done = Math.abs(ease.target - ease.cur) < 0.5;
    if (done) ease.cur = ease.target;
    window.scrollTo(0, ease.cur);
    update();                                                        // draw in the same frame as the scroll
    if (done) easeStop(); else ease.raf = requestAnimationFrame(easeStep);
  }
  function onWheel(e) {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.shiftKey) return;   // zoom and sideways scrolling stay native
    let dy = e.deltaY;
    if (!dy || Math.abs(e.deltaX) > Math.abs(dy)) return;
    if (e.deltaMode === 1) dy *= LINE; else if (e.deltaMode === 2) dy *= G.vh;
    if (nestedScroll(e.target, dy)) return;                          // e.g. the open mobile menu
    e.preventDefault();
    if (!ease.active) { ease.cur = window.scrollY; ease.target = ease.cur; }
    ease.target = clamp(ease.target + dy, 0, Math.max(0, root.scrollHeight - G.vh));
    if (!ease.active) {
      ease.active = true; ease.t = 0;
      root.style.scrollBehavior = 'auto';
      ease.raf = requestAnimationFrame(easeStep);
    }
  }
  // any other kind of scrolling takes over at once
  const onNativeScroll = () => { if (ease.active && Math.abs(window.scrollY - ease.cur) > 3) easeStop(); };
  const SCROLL_KEYS = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Tab'];
  const onKey = (e) => { if (SCROLL_KEYS.includes(e.key)) easeStop(); };
  function setSmooth() {
    const want = finePointer.matches && !reduce.matches;
    if (want === ease.on) return;
    ease.on = want;
    const m = want ? 'addEventListener' : 'removeEventListener';
    window[m]('wheel', onWheel, { passive: false });
    window[m]('scroll', onNativeScroll, { passive: true });
    window[m]('keydown', onKey);
    window[m]('touchstart', easeStop, { passive: true });
    if (!want) easeStop();
  }

  const onMode = () => { setJourneyMode(); setMomentMode(); setSda(); setSmooth(); measure(); requestUpdate(true); };
  wide.addEventListener('change', onMode);
  reduce.addEventListener('change', onMode);
  finePointer.addEventListener('change', setSmooth);

  const urlLang = params.get('lang'), urlRoute = params.get('to') || params.get('from');
  lang = (urlLang || store.get('jc-lang')) === 'si' && Object.keys(SI).length ? 'si' : 'en';
  route = (urlRoute || store.get('jc-route')) === 'ph' ? 'ph' : 'il';
  if (urlLang) store.set('jc-lang', lang);
  if (urlRoute) store.set('jc-route', route);
  setSda();
  setSmooth();
  render();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); requestUpdate(true); });
})();
