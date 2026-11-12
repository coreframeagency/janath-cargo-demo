// HTML for the dashboard, its login, and the public unsubscribe page. Styles: public/admin.css (the site's tokens).
const { esc, zwj } = require('./welcome');

const ICON = {
  users: '<path d="M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19"/><circle cx="10" cy="7.5" r="3.5"/><path d="M20 19v-1.5a3.5 3.5 0 0 0-2.5-3.35M15.5 4.15a3.5 3.5 0 0 1 0 6.7"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
  box: '<path d="m3.5 7.5 8.5-4 8.5 4v9l-8.5 4-8.5-4Z"/><path d="m3.5 7.5 8.5 4 8.5-4M12 11.5v9"/>',
  truck: '<path d="M2.5 6.5h11v9h-11zM13.5 9.5h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
  chat: '<path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3.5 20l1.1-4.2A8.5 8.5 0 1 1 20.5 11.5Z"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  out: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l-4-4 4-4M6 12h10"/>',
  down: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
};
const icon = (n) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICON[n]}</svg>`;

const shell = (title, body, cls = '') => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>${esc(title)}</title>
<link rel="icon" href="/assets/img/logo-symbol.png"><link rel="stylesheet" href="/assets/admin.css"></head>
<body class="${cls}">${body}</body></html>`;

function login({ error }) {
  const msg = { wrong: 'That password isn’t right.', busy: 'Too many tries. Wait 15 minutes and try again.', unset: 'The dashboard password hasn’t been set up yet.' }[error];
  return shell('Sign in · Janath Cargo', `
<main class="auth">
  <div class="auth-card">
    <img class="auth-logo" src="/assets/img/logo-primary.png" width="67" height="80" alt="Janath Cargo">
    <h1 class="h1">Dashboard<span class="amb">.</span></h1>
    <p class="muted">Sign in to see who has signed up for updates.</p>
    ${msg ? `<p class="alert" role="alert">${esc(msg)}</p>` : ''}
    <form method="post" action="/admin/login" class="stack">
      <label class="field"><span class="flabel">Password</span><input type="password" name="password" autocomplete="current-password" required autofocus ${error === 'unset' ? 'disabled' : ''}></label>
      <button class="btn btn-amber" type="submit" ${error === 'unset' ? 'disabled' : ''}>Sign in</button>
    </form>
  </div>
</main>`, 'auth-page');
}

function dashboard({ siteUrl, email }) {
  const soon = ['Bookings', 'Shipments', 'Customers', 'Messages'];
  const soonIcons = ['cal', 'truck', 'box', 'chat'];
  return shell('Sign-ups · Janath Cargo', `
<div class="app">
  <aside class="side">
    <a class="brand" href="/admin"><span class="brand-mark"><img src="/assets/img/logo-symbol.png" width="16" height="26" alt=""></span><span>Janath Cargo</span></a>
    <nav class="snav" aria-label="Dashboard">
      <a class="on" href="/admin" aria-current="page">${icon('users')}<span>Sign-ups</span></a>
      <p class="snav-h">With the full system</p>
      ${soon.map((s, i) => `<span class="off" aria-disabled="true">${icon(soonIcons[i])}<span>${s}</span><em>Soon</em></span>`).join('')}
    </nav>
    <div class="side-foot">
      <a href="${esc(siteUrl)}/" target="_blank" rel="noopener">${icon('ext')}<span>Open website</span></a>
      <form method="post" action="/admin/logout"><button type="submit">${icon('out')}<span>Sign out</span></button></form>
    </div>
  </aside>

  <main class="main" id="main">
    <header class="top">
      <div>
        <p class="label">Website</p>
        <h1 class="h1">Sign-ups<span class="amb">.</span></h1>
        <p class="muted">People who asked for Janath Cargo updates on the website.</p>
      </div>
      <div class="top-act">
        <button class="btn btn-ghost" type="button" data-preview>${icon('mail')}<span>Welcome email</span></button>
        <a class="btn btn-navy" href="/admin/export.csv" data-export>${icon('down')}<span>Export CSV</span></a>
      </div>
    </header>

    <div class="banner ${email.on ? 'banner-on' : ''}" data-banner>
      ${email.on
        ? `<strong>Welcome email is on.</strong> <span>New sign-ups get it within a couple of minutes${email.from && email.from !== 'outbox' ? `, from ${esc(email.from)}` : ''}.</span>`
        : `<strong>Welcome email isn’t connected yet.</strong> <span data-waiting>Sign-ups are saved and will get it as soon as an email account is connected.</span>`}
    </div>

    <section class="stats" aria-label="Totals">
      <article class="stat stat-lead"><p class="stat-k">On the list</p><p class="stat-v" data-s="active">–</p><p class="stat-d" data-s="trend"></p></article>
      <article class="stat"><p class="stat-k">Israel</p><p class="stat-v" data-s="IL">–</p><div class="bar"><i data-b="IL"></i></div></article>
      <article class="stat"><p class="stat-k">Sri Lanka</p><p class="stat-v" data-s="LK">–</p><div class="bar"><i data-b="LK"></i></div></article>
      <article class="stat"><p class="stat-k">Philippines</p><p class="stat-v" data-s="PH">–</p><div class="bar"><i data-b="PH"></i></div></article>
    </section>

    <section class="card chart-card" aria-labelledby="ch-t">
      <div class="card-h"><h2 class="h3" id="ch-t">Last 30 days</h2><p class="muted small" data-s="lang"></p></div>
      <div class="chart" data-chart role="img" aria-label="Sign-ups per day over the last 30 days"></div>
    </section>

    <section class="card" aria-labelledby="tb-t">
      <div class="card-h">
        <h2 class="h3" id="tb-t">Everyone who signed up</h2>
        <div class="tools">
          <label class="search">${icon('search')}<span class="sr-only">Search</span><input type="search" placeholder="Search name, email or phone" data-q></label>
          <div class="seg" role="group" aria-label="Country">
            <button type="button" class="on" data-c="">All</button><button type="button" data-c="IL">Israel</button><button type="button" data-c="LK">Sri Lanka</button><button type="button" data-c="PH">Philippines</button>
          </div>
          <label class="field field-s"><span class="sr-only">Show</span><select data-st><option value="active">On the list</option><option value="left">Unsubscribed</option><option value="all">Everyone</option></select></label>
        </div>
      </div>
      <div class="tbl-wrap">
        <table class="tbl">
          <thead><tr><th>Name</th><th>Email</th><th>Country</th><th>Phone</th><th>Language</th><th>Joined</th><th>Welcome email</th></tr></thead>
          <tbody data-rows><tr><td colspan="7" class="empty">Loading…</td></tr></tbody>
        </table>
      </div>
      <div class="pager"><p class="muted small" data-count></p><div><button class="btn btn-ghost btn-s" type="button" data-prev disabled>Previous</button><button class="btn btn-ghost btn-s" type="button" data-next disabled>Next</button></div></div>
    </section>
  </main>
</div>

<dialog class="dlg" data-dlg aria-labelledby="dlg-t">
  <div class="dlg-h">
    <h2 class="h3" id="dlg-t">Welcome email</h2>
    <div class="seg" role="group" aria-label="Language"><button type="button" class="on" data-pl="en">English</button><button type="button" data-pl="si">සිංහල</button></div>
    <div class="seg" role="group" aria-label="Country"><button type="button" class="on" data-pc="IL">Israel</button><button type="button" data-pc="LK">Sri Lanka</button><button type="button" data-pc="PH">Philippines</button></div>
    <button class="x" type="button" data-close aria-label="Close">×</button>
  </div>
  <p class="muted small dlg-sub">What a new sign-up receives. It follows the language and country they chose on the website.</p>
  <iframe title="Welcome email preview" data-frame></iframe>
</dialog>
<script src="/assets/admin.js" defer></script>`, 'dash');
}

function unsub({ state, lang, token, name, siteUrl }) {
  const si = lang === 'si';
  const T = si ? {
    ask: 'Janath Cargo යාවත්කාලීන ලැබීම නවත්වන්නද?', askP: 'ඔබට අපෙන් තවත් ඊමේල් නොලැබේ. ඕනෑම වේලාවක වෙබ් අඩවියෙන් නැවත ලියාපදිංචි විය හැක.', btn: 'ලැයිස්තුවෙන් ඉවත් වන්න',
    done: 'ඔබ ලැයිස්තුවෙන් ඉවත් විය.', doneP: 'ඔබට තවත් යාවත්කාලීන ඊමේල් නොලැබේ. පාර්සලයක් යැවීමට අවශ්‍ය නම් WhatsApp හරහා අපට පණිවිඩයක් එවන්න.',
    missing: 'මෙම සබැඳිය වලංගු නැත.', missingP: 'එය කල් ඉකුත් වී හෝ අසම්පූර්ණ විය හැක. උදව් අවශ්‍ය නම් WhatsApp හරහා අපට පණිවිඩයක් එවන්න.', site: 'වෙබ් අඩවියට යන්න',
  } : {
    ask: 'Stop Janath Cargo updates?', askP: 'You won’t get any more emails from us. You can sign up again on the website any time.', btn: 'Unsubscribe',
    done: 'You’re unsubscribed.', doneP: 'You won’t get any more update emails. If you need to send a parcel, message us on WhatsApp.',
    missing: 'This link doesn’t work.', missingP: 'It may be incomplete or out of date. If you need help, message us on WhatsApp.', site: 'Go to the website',
  };
  const z = si ? zwj : (x) => x;
  const h = { ask: T.ask, done: T.done, missing: T.missing }[state], ptext = { ask: T.askP, done: T.doneP, missing: T.missingP }[state];
  return shell(z(h) + ' · Janath Cargo', `
<main class="auth" lang="${si ? 'si' : 'en'}">
  <div class="auth-card">
    <img class="auth-logo" src="/assets/img/logo-primary.png" width="67" height="80" alt="Janath Cargo">
    <h1 class="h1">${esc(z(h))}</h1>
    <p class="muted">${esc(z(ptext))}</p>
    ${state === 'ask' ? `<form method="post" action="/unsubscribe?t=${encodeURIComponent(token)}" class="stack"><button class="btn btn-navy" type="submit">${esc(z(T.btn))}</button></form>` : ''}
    <p class="auth-links"><a href="${esc(siteUrl)}/">${esc(z(T.site))}</a> · <a href="https://wa.me/972547415262">WhatsApp +972 54-741-5262</a></p>
  </div>
</main>`, 'auth-page');
}

module.exports = { login, dashboard, unsub };
