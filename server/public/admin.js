// Janath Cargo dashboard: totals, 30-day chart, the sign-up list, and the welcome email preview.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const COUNTRY = { IL: 'Israel', LK: 'Sri Lanka', PH: 'Philippines' };
  const STATUS = { sent: 'Sent', pending: 'Waiting', failed: 'Didn’t send', left: 'Unsubscribed' };
  const TZ = 'Asia/Jerusalem';
  const fmtDate = (d) => new Intl.DateTimeFormat('en-GB', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d));
  const fmtTime = (d) => new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(new Date(d));
  const nf = new Intl.NumberFormat('en');
  let emailOn = false;
  // +972501234567 → +972 50 123 4567 (display only; stored as entered, in international form)
  const fmtPhone = (p) => {
    const m = String(p).match(/^\+(972|94|63)(\d+)$/);
    if (!m) return p;
    const d = m[2], a = m[1] === '63' ? 3 : 2;
    return `+${m[1]} ${d.slice(0, a)} ${d.slice(a, a + 3)} ${d.slice(a + 3)}`.trim();
  };

  async function api(path, opts) {
    const r = await fetch(path, { credentials: 'same-origin', ...opts });
    if (r.status === 401) { location.href = '/admin/login'; throw new Error('signed out'); }
    return r.json();
  }

  /* totals and chart */
  async function loadStats() {
    const { stats: s, email } = await api('/admin/api/stats');
    emailOn = email.on;
    $('[data-s="active"]').textContent = nf.format(s.active);
    const diff = s.week - s.prev_week;
    $('[data-s="trend"]').textContent = `${nf.format(s.week)} this week` + (s.prev_week || s.week ? ` · ${diff >= 0 ? '+' : '−'}${nf.format(Math.abs(diff))} on last week` : '');
    for (const c of ['IL', 'LK', 'PH']) {
      const n = s.byCountry[c] || 0;
      $(`[data-s="${c}"]`).textContent = nf.format(n);
      $(`[data-b="${c}"]`).style.width = s.active ? `${(100 * n / s.active).toFixed(1)}%` : '0';
    }
    const en = s.byLang.en || 0, si = s.byLang.si || 0;
    $('[data-s="lang"]').textContent = s.active ? `${nf.format(en)} English · ${nf.format(si)} Sinhala` : '';
    const w = $('[data-waiting]');
    if (w && s.waiting) w.textContent = `${nf.format(s.waiting)} ${s.waiting === 1 ? 'person is' : 'people are'} waiting for it. They'll get it as soon as an email account is connected.`;
    drawChart(s.days);
  }
  function drawChart(days) {
    const el = $('[data-chart]');
    const max = Math.max(1, ...days.map((d) => d.n));
    const today = days[days.length - 1] && days[days.length - 1].day;
    const label = (iso) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(iso + 'T00:00:00Z'));
    el.innerHTML = days.map((d) => `<div class="col${d.day === today ? ' today' : ''}"><i></i><span>${esc(label(d.day))}: ${d.n}</span></div>`).join('');
    // heights go through the CSSOM: the dashboard's content policy doesn't allow inline style attributes
    $$('.col i', el).forEach((bar, k) => { bar.style.height = `${Math.max(1.5, (100 * days[k].n) / max)}%`; });
    let axis = el.nextElementSibling;
    if (!axis || !axis.classList.contains('chart-axis')) { axis = document.createElement('div'); axis.className = 'chart-axis'; el.after(axis); }
    axis.innerHTML = `<span>${esc(label(days[0].day))}</span><span>Today</span>`;
  }

  /* list */
  const state = { q: '', country: '', status: 'active', offset: 0, limit: 50 };
  let timer;
  async function loadRows() {
    const p = new URLSearchParams({ q: state.q, country: state.country, status: state.status, offset: state.offset, limit: state.limit });
    const r = await api('/admin/api/subscribers?' + p);
    const tb = $('[data-rows]');
    if (!r.rows.length) {
      tb.innerHTML = `<tr><td colspan="7" class="empty">${state.q || state.country || state.status !== 'active' ? 'No one matches these filters.' : 'No sign-ups yet. They’ll appear here as soon as people join from the website.'}</td></tr>`;
    } else {
      tb.innerHTML = r.rows.map((s) => {
        const st = s.unsubscribed_at ? 'left' : s.welcome_status;
        const retry = emailOn && !s.unsubscribed_at && (st === 'failed' || st === 'pending') ? `<button class="act" type="button" data-send="${esc(s.id)}">Send now</button>` : '';
        const title = st === 'failed' && s.welcome_error ? ` title="${esc(s.welcome_error)}"` : st === 'sent' && s.welcome_sent_at ? ` title="Sent ${esc(fmtDate(s.welcome_sent_at))} ${esc(fmtTime(s.welcome_sent_at))}"` : '';
        const wa = String(s.phone).replace(/\D/g, '');
        return `<tr>
          <td class="nm">${esc(s.name)}</td>
          <td><a href="mailto:${esc(s.email)}">${esc(s.email)}</a></td>
          <td><span class="flag">${esc(COUNTRY[s.country] || s.country)}</span></td>
          <td><a class="wa" href="https://wa.me/${wa}" target="_blank" rel="noopener" title="Open in WhatsApp"><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3.5 20l1.1-4.2A8.5 8.5 0 1 1 20.5 11.5Z"/></svg>${esc(fmtPhone(s.phone))}</a></td>
          <td>${s.lang === 'si' ? 'Sinhala' : 'English'}</td>
          <td>${esc(fmtDate(s.created_at))} <span class="muted small">${esc(fmtTime(s.created_at))}</span></td>
          <td><span class="pill ${st}"${title}>${STATUS[st] || st}</span>${retry}</td>
        </tr>`;
      }).join('');
    }
    const from = r.total ? state.offset + 1 : 0, to = Math.min(r.total, state.offset + r.rows.length);
    $('[data-count]').textContent = r.total ? `${nf.format(from)}–${nf.format(to)} of ${nf.format(r.total)}` : '';
    $('[data-prev]').disabled = state.offset === 0;
    $('[data-next]').disabled = to >= r.total;
    $('[data-export]').href = '/admin/export.csv?status=' + encodeURIComponent(state.status);
  }

  $('[data-q]').addEventListener('input', (e) => { clearTimeout(timer); timer = setTimeout(() => { state.q = e.target.value.trim(); state.offset = 0; loadRows(); }, 250); });
  $$('[data-c]').forEach((b) => b.addEventListener('click', () => { $$('[data-c]').forEach((x) => x.classList.toggle('on', x === b)); state.country = b.dataset.c; state.offset = 0; loadRows(); }));
  $('[data-st]').addEventListener('change', (e) => { state.status = e.target.value; state.offset = 0; loadRows(); });
  $('[data-prev]').addEventListener('click', () => { state.offset = Math.max(0, state.offset - state.limit); loadRows(); });
  $('[data-next]').addEventListener('click', () => { state.offset += state.limit; loadRows(); });
  $('[data-rows]').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-send]'); if (!b) return;
    b.disabled = true; b.textContent = 'Sending…';
    const r = await api(`/admin/api/subscribers/${b.dataset.send}/welcome`, { method: 'POST' });
    b.textContent = r.ok ? 'Sent' : 'Didn’t send';
    setTimeout(() => { loadRows(); loadStats(); }, 600);
  });

  /* welcome email preview */
  const dlg = $('[data-dlg]'), frame = $('[data-frame]');
  const pv = { lang: 'en', country: 'IL' };
  const showPreview = () => { frame.src = `/admin/email-preview?lang=${pv.lang}&country=${pv.country}`; };
  $('[data-preview]').addEventListener('click', () => { showPreview(); dlg.showModal(); });
  $('[data-close]').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  $$('[data-pl]').forEach((b) => b.addEventListener('click', () => { $$('[data-pl]').forEach((x) => x.classList.toggle('on', x === b)); pv.lang = b.dataset.pl; showPreview(); }));
  $$('[data-pc]').forEach((b) => b.addEventListener('click', () => { $$('[data-pc]').forEach((x) => x.classList.toggle('on', x === b)); pv.country = b.dataset.pc; showPreview(); }));

  loadStats().then(loadRows);
  setInterval(() => { if (!document.hidden) { loadStats(); loadRows(); } }, 60000);
})();
