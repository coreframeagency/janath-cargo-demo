/* Janath Cargo — site behaviour: language switch, WhatsApp messages, quote widget, header, menu, photo slots, reveals. */
(() => {
  const WA = '972547415262';
  const root = document.documentElement;
  const SI = window.JC_SI || {};
  const MSG = window.JC_MSG || { en: {}, si: {} };
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } },
  };
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

  /* Photo slots: a photo dropped into assets/photos/ replaces the illustration automatically. */
  if (/[?&]slots\b/.test(location.search)) root.classList.add('show-slots');
  $$('.ph .photo').forEach((img) => {
    const ok = () => img.closest('.ph').classList.add('has-photo');
    const missing = () => img.remove();
    if (img.complete) { (img.naturalWidth ? ok : missing)(); }
    else { img.addEventListener('load', ok, { once: true }); img.addEventListener('error', missing, { once: true }); }
  });

  /* Language */
  let lang = 'en';
  const textNodes = $$('[data-i18n]');
  const EN = {}, EN_PH = {}, EN_ARIA = {};
  textNodes.forEach((n) => { if (!(n.dataset.i18n in EN)) EN[n.dataset.i18n] = n.innerHTML; });
  $$('[data-i18n-ph]').forEach((n) => { EN_PH[n.dataset.i18nPh] = n.getAttribute('placeholder'); });
  $$('[data-i18n-aria]').forEach((n) => { EN_ARIA[n.dataset.i18nAria] = n.getAttribute('aria-label'); });
  const TITLE_EN = document.title;

  const waUrl = (text) => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;
  const msg = (key) => (MSG[lang] && MSG[lang][key]) || MSG.en[key] || '';

  function updateWaLinks() {
    $$('[data-wa]').forEach((a) => { const t = msg(a.dataset.wa); if (t) a.href = waUrl(t); });
    $$('[data-form] input[name="text"]').forEach((h) => { h.value = msg(h.closest('form').dataset.form); });
  }

  function setLang(next, remember) {
    lang = next === 'si' && Object.keys(SI).length ? 'si' : 'en';
    root.lang = lang;
    textNodes.forEach((n) => {
      const k = n.dataset.i18n;
      const v = lang === 'si' ? SI[k] : EN[k];
      if (v != null && n.innerHTML !== v) n.innerHTML = v;
    });
    $$('[data-i18n-ph]').forEach((n) => {
      const k = n.dataset.i18nPh; const v = lang === 'si' ? SI[k] : EN_PH[k];
      if (v != null) n.setAttribute('placeholder', v);
    });
    $$('[data-i18n-aria]').forEach((n) => {
      const k = n.dataset.i18nAria; const v = lang === 'si' ? SI[k] : EN_ARIA[k];
      if (v != null) n.setAttribute('aria-label', v);
    });
    document.title = lang === 'si' && SI['meta.title'] ? SI['meta.title'] : TITLE_EN;
    $$('[data-lang-toggle] .lang-label').forEach((l) => {
      if (lang === 'si') { l.textContent = 'English'; l.lang = 'en'; }
      else { l.textContent = 'සිංහල'; l.lang = 'si'; }
    });
    updateWaLinks();
    if (remember) store.set('jc-lang', lang);
  }

  $$('[data-lang-toggle]').forEach((b) => b.addEventListener('click', () => setLang(lang === 'si' ? 'en' : 'si', true)));
  const fromUrl = new URLSearchParams(location.search).get('lang');
  setLang(fromUrl || store.get('jc-lang') || 'en', Boolean(fromUrl));

  /* Quote / update widget */
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

  const today = new Date();
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  $$('input[type="date"]').forEach((d) => { d.min = iso(today); });
  const fmtDate = (v) => {
    if (lang === 'si') return v; // YYYY-MM-DD reads clearly in any locale
    try { return new Date(`${v}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); }
    catch (e) { return v; }
  };

  function openWhatsApp(url) {
    const a = document.createElement('a');
    a.href = url; a.target = '_blank'; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
  }

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
      openWhatsApp(waUrl(lines.join('\n')));
    });
  });

  /* Header */
  const head = document.querySelector('[data-head]');
  const menuBtn = head.querySelector('.menu-btn');
  const mnav = document.getElementById('mnav');
  const onScroll = () => head.classList.toggle('is-stuck', window.scrollY > 24 || menuBtn.getAttribute('aria-expanded') === 'true');
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const setMenu = (open) => {
    menuBtn.setAttribute('aria-expanded', String(open));
    mnav.hidden = !open;
    onScroll();
  };
  menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  mnav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !mnav.hidden) { setMenu(false); menuBtn.focus(); } });
  window.matchMedia('(min-width: 1061px)').addEventListener('change', (m) => { if (m.matches) setMenu(false); });

  $$('[data-quote-link]').forEach((a) => a.addEventListener('click', () => {
    selectTab(tabs[0]);
    setTimeout(() => { const f = document.querySelector('[data-f="from"]'); if (f) f.focus({ preventScroll: true }); }, 450);
  }));

  /* Reveal on scroll */
  const reveals = $$('.reveal');
  reveals.forEach((el) => {
    const sibs = Array.from(el.parentElement.children).filter((c) => c.classList.contains('reveal'));
    const i = sibs.indexOf(el);
    if (i > 0) el.style.transitionDelay = `${Math.min(i, 4) * 80}ms`;
  });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('in'));
  }
})();
