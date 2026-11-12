// Janath Cargo API: update sign-ups from the website, the welcome email, unsubscribe, and Janath's dashboard.
// No framework: node:http, Postgres through `pg`, email through `nodemailer` or Resend (see lib/mail.js).
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const db = require('./lib/db').create(process.env.DATABASE_URL);
const mail = require('./lib/mail').create(process.env);
const { welcome, esc, zwj } = require('./lib/welcome');
const pages = require('./lib/pages');

const PORT = Number(process.env.PORT || 8790);
const SITE_URL = (process.env.SITE_URL || 'https://janath-cargo-site.onrender.com').replace(/\/$/, '');
const API_URL = (process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || `http://127.0.0.1:${PORT}`).replace(/\/$/, '');
const ORIGINS = new Set((process.env.SITE_ORIGINS || `${SITE_URL},http://127.0.0.1:8765,http://localhost:8765`).split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean));
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const SECRET = process.env.SESSION_SECRET || crypto.createHash('sha256').update('jc:' + ADMIN_PASSWORD).digest('hex');
const SECURE = API_URL.startsWith('https://');
const cfg = { siteUrl: SITE_URL, apiUrl: API_URL };

/* ---------- small helpers ---------- */
const send = (res, status, body, headers = {}) => { res.writeHead(status, headers); res.end(body); };
const json = (res, status, obj, headers = {}) => send(res, status, JSON.stringify(obj), { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
const ipOf = (req) => (String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || '?');
function readBody(req, max = 16 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > max) { reject(Object.assign(new Error('too large'), { status: 413 })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}
const parseForm = (s) => Object.fromEntries(new URLSearchParams(s));

// fixed-window limiter per ip + bucket
const hits = new Map();
function limited(key, max, windowMs) {
  const now = Date.now(); const h = hits.get(key);
  if (!h || now > h.reset) { hits.set(key, { n: 1, reset: now + windowMs }); return false; }
  h.n += 1; return h.n > max;
}
setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (now > v.reset) hits.delete(k); }, 60000).unref();

/* ---------- validating a sign-up ---------- */
const DIAL = { IL: '972', LK: '94', PH: '63' };
const EMAIL_RE = /^[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[a-z]{2,}$/i;
function normPhone(raw, country) {
  let p = String(raw || '').trim().replace(/[^\d+]/g, '');
  if (p.startsWith('00')) p = '+' + p.slice(2);
  if (!p.startsWith('+')) {
    const dial = DIAL[country] || '';
    if (p.startsWith('0')) p = '+' + dial + p.slice(1);
    else if (dial && p.startsWith(dial) && p.length >= 10) p = '+' + p;
    else p = '+' + dial + p;
  }
  p = '+' + p.slice(1).replace(/\+/g, '');
  return /^\+\d{8,15}$/.test(p) ? p : null;
}
function validate(b) {
  const errors = {};
  const name = String(b.name || '').replace(/\s+/g, ' ').trim();
  const email = String(b.email || '').trim().toLowerCase();
  const country = String(b.country || '').toUpperCase();
  if (name.length < 2 || name.length > 120) errors.name = 'name';
  if (!EMAIL_RE.test(email) || email.length > 254) errors.email = 'email';
  if (!DIAL[country]) errors.country = 'country';
  const phone = normPhone(b.phone, country);
  if (!phone) errors.phone = 'phone';
  return { errors, value: { name, email, country, phone, lang: b.lang === 'si' ? 'si' : 'en', route: b.route === 'ph' ? 'ph' : 'il', source: 'website' } };
}

/* ---------- welcome email queue ---------- */
let sending = false;
async function sendWelcome(s) {
  const m = welcome(s, cfg);
  const oneClick = `${API_URL}/unsubscribe/one-click?t=${encodeURIComponent(s.unsub_token)}`;
  try {
    await mail.send({ to: s.email, subject: m.subject, html: m.html, text: m.text, headers: { 'List-Unsubscribe': `<${oneClick}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } });
    await db.setWelcome(s.id, 'sent', null);
    return { ok: true };
  } catch (e) {
    console.error('welcome email failed', s.id, e.message);
    await db.setWelcome(s.id, 'failed', e.message);
    return { ok: false, error: e.message };
  }
}
async function drainQueue() {
  if (!mail.on || sending) return;
  sending = true;
  try { for (const s of await db.pending(10)) await sendWelcome(s); }
  catch (e) { console.error('queue', e.message); }
  finally { sending = false; }
}
setInterval(drainQueue, 90 * 1000).unref();

/* ---------- admin session ---------- */
const sign = (v) => crypto.createHmac('sha256', SECRET).update(v).digest('base64url');
function cookies(req) { return Object.fromEntries(String(req.headers.cookie || '').split(';').map((c) => c.trim().split('=')).filter((p) => p[0]).map(([k, ...v]) => [k, decodeURIComponent(v.join('='))])); }
function isAdmin(req) {
  if (!ADMIN_PASSWORD) return false;
  const c = cookies(req).jc_s; if (!c) return false;
  const [exp, mac] = c.split('.');
  if (!exp || !mac || Number(exp) < Date.now()) return false;
  const want = sign(exp);
  return want.length === mac.length && crypto.timingSafeEqual(Buffer.from(want), Buffer.from(mac));
}
function sessionCookie(days = 14) {
  const exp = String(Date.now() + days * 864e5);
  return `jc_s=${exp}.${sign(exp)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${days * 86400}${SECURE ? '; Secure' : ''}`;
}
const passwordOk = (p) => { const a = crypto.createHash('sha256').update(String(p)).digest(), b = crypto.createHash('sha256').update(ADMIN_PASSWORD).digest(); return ADMIN_PASSWORD && crypto.timingSafeEqual(a, b); };
// admin form posts must come from this service's own pages
const sameOrigin = (req) => { const o = req.headers.origin; return !o || o === API_URL || o === `http${SECURE ? 's' : ''}://${req.headers.host}`; };

/* ---------- static files for the dashboard and public pages ---------- */
const PUB = path.join(__dirname, 'public');
const TYPES = { '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.woff': 'font/woff', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
function serveStatic(res, rel) {
  const f = path.normalize(path.join(PUB, rel));
  if (!f.startsWith(PUB + path.sep)) return send(res, 404, 'Not found');
  fs.readFile(f, (err, buf) => {
    if (err) return send(res, 404, 'Not found');
    send(res, 200, buf, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'public, max-age=3600' });
  });
}
const PAGE_HEADERS = {
  'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin',
  'Content-Security-Policy': `default-src 'self'; img-src 'self' data: ${SITE_URL}; style-src 'self'; script-src 'self'; frame-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'none'`,
};
const page = (res, status, html) => send(res, status, html, PAGE_HEADERS);

/* ---------- CSV ---------- */
const COUNTRY_EN = { IL: 'Israel', LK: 'Sri Lanka', PH: 'Philippines' };
const csvCell = (v) => { let s = v == null ? '' : v instanceof Date ? v.toISOString() : String(v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

/* ---------- routes ---------- */
async function route(req, res) {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname.replace(/\/+$/, '') || '/';
  const m = req.method;

  if (p === '/health') { let dbOk = false; try { dbOk = await db.ping(); } catch (e) { /* reported below */ } return json(res, dbOk ? 200 : 503, { ok: dbOk, db: db.kind, email: mail.kind }); }
  if (p === '/') return send(res, 302, '', { Location: '/admin' });
  if (p.startsWith('/assets/')) return serveStatic(res, p.slice('/assets/'.length));
  if (p === '/favicon.ico') return serveStatic(res, 'img/logo-symbol.png');

  /* sign-up from the website */
  if (p === '/api/subscribe') {
    const origin = req.headers.origin;
    const cors = origin && ORIGINS.has(origin) ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {};
    if (m === 'OPTIONS') return send(res, 204, '', { ...cors, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' });
    if (m !== 'POST') return json(res, 405, { ok: false }, cors);
    if (origin && !ORIGINS.has(origin)) return json(res, 403, { ok: false, error: 'origin' });
    if (limited('sub:' + ipOf(req), 8, 10 * 60 * 1000)) return json(res, 429, { ok: false, error: 'busy' }, cors);
    let body; try { body = JSON.parse(await readBody(req)); } catch (e) { return json(res, 400, { ok: false, error: 'bad' }, cors); }
    if (body.company) return json(res, 200, { ok: true }, cors); // honeypot: bots fill the hidden field
    const { errors, value } = validate(body);
    if (Object.keys(errors).length) return json(res, 422, { ok: false, error: 'invalid', fields: errors }, cors);
    const r = await db.add(value);
    if (!r.existed) drainQueue();
    return json(res, r.existed ? 200 : 201, { ok: true, already: !!r.existed, name: r.row.name.split(' ')[0] }, cors);
  }

  /* unsubscribe: a page with a button (mail scanners open links but don't press buttons), plus one-click for mail apps */
  if (p === '/unsubscribe/one-click' && m === 'POST') { const s = await db.unsubscribe(url.searchParams.get('t') || ''); return json(res, s ? 200 : 404, { ok: !!s }); }
  if (p === '/unsubscribe') {
    const t = url.searchParams.get('t') || '';
    if (m === 'POST') { const s = await db.unsubscribe(t); return page(res, s ? 200 : 404, pages.unsub({ state: s ? 'done' : 'missing', lang: s ? s.lang : 'en', siteUrl: SITE_URL })); }
    const s = await db.byToken(t);
    return page(res, s ? 200 : 404, pages.unsub({ state: !s ? 'missing' : s.unsubscribed_at ? 'done' : 'ask', lang: s ? s.lang : 'en', token: t, name: s && s.name, siteUrl: SITE_URL }));
  }

  /* dashboard */
  if (p === '/admin/login') {
    if (m === 'POST') {
      if (!sameOrigin(req)) return send(res, 403, 'Forbidden');
      if (limited('login:' + ipOf(req), 10, 15 * 60 * 1000)) return page(res, 429, pages.login({ error: 'busy' }));
      const f = parseForm(await readBody(req));
      if (!passwordOk(f.password || '')) return page(res, 401, pages.login({ error: 'wrong' }));
      return send(res, 303, '', { Location: '/admin', 'Set-Cookie': sessionCookie() });
    }
    return page(res, 200, pages.login({ error: ADMIN_PASSWORD ? null : 'unset' }));
  }
  if (p === '/admin/logout' && m === 'POST') return send(res, 303, '', { Location: '/admin/login', 'Set-Cookie': `jc_s=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${SECURE ? '; Secure' : ''}` });
  if (p.startsWith('/admin')) {
    if (!isAdmin(req)) return p.startsWith('/admin/api') ? json(res, 401, { ok: false }) : send(res, 303, '', { Location: '/admin/login' });
    if (p === '/admin') return page(res, 200, pages.dashboard({ siteUrl: SITE_URL, email: { on: mail.on, kind: mail.kind, from: mail.from } }));

    if (p === '/admin/api/stats') return json(res, 200, { ok: true, stats: await db.stats(), email: { on: mail.on, kind: mail.kind, from: mail.from } });
    if (p === '/admin/api/subscribers') {
      const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 50));
      const offset = Math.max(0, Number(url.searchParams.get('offset')) || 0);
      const country = DIAL[url.searchParams.get('country')] ? url.searchParams.get('country') : null;
      const r = await db.list({ q: (url.searchParams.get('q') || '').slice(0, 80), country, status: url.searchParams.get('status') || 'active', limit, offset });
      return json(res, 200, { ok: true, ...r, limit, offset });
    }
    const resend = p.match(/^\/admin\/api\/subscribers\/(\d+)\/welcome$/);
    if (resend && m === 'POST') {
      if (!sameOrigin(req)) return json(res, 403, { ok: false });
      if (!mail.on) return json(res, 409, { ok: false, error: 'Email is not connected yet' });
      const s = await db.get(resend[1]);
      if (!s || s.unsubscribed_at) return json(res, 404, { ok: false });
      return json(res, 200, await sendWelcome(s));
    }
    if (p === '/admin/export.csv') {
      const { rows } = await db.list({ status: url.searchParams.get('status') || 'active', limit: 100000, offset: 0 });
      const head = ['Name', 'Email', 'Country', 'Phone', 'Language', 'Joined', 'Welcome email', 'Unsubscribed'];
      const lines = [head.join(',')].concat(rows.map((r) => [r.name, r.email, COUNTRY_EN[r.country], r.phone, r.lang === 'si' ? 'Sinhala' : 'English', r.created_at, r.welcome_status, r.unsubscribed_at || ''].map(csvCell).join(',')));
      const day = new Date().toISOString().slice(0, 10);
      return send(res, 200, '﻿' + lines.join('\r\n'), { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="janath-cargo-signups-${day}.csv"`, 'Cache-Control': 'no-store' });
    }
    if (p === '/admin/email-preview') {
      const lang = url.searchParams.get('lang') === 'si' ? 'si' : 'en';
      const country = DIAL[url.searchParams.get('country')] ? url.searchParams.get('country') : 'IL';
      const sample = { name: lang === 'si' ? zwj('නිමාලි පෙරේරා') : 'Nimali Perera', email: 'nimali@example.com', country, phone: country === 'IL' ? '+972 50 123 4567' : country === 'LK' ? '+94 77 123 4567' : '+63 917 123 4567', lang, unsub_token: 'preview' };
      const w = welcome(sample, cfg);
      return send(res, 200, w.html, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Security-Policy': `default-src 'none'; img-src ${SITE_URL} data:; style-src 'unsafe-inline'; frame-ancestors 'self'` });
    }
    return json(res, 404, { ok: false });
  }

  return send(res, 404, 'Not found', { 'Content-Type': 'text/plain' });
}

const server = http.createServer((req, res) => {
  route(req, res).catch((e) => {
    console.error(req.method, req.url, e.stack || e.message);
    if (!res.headersSent) json(res, e.status || 500, { ok: false, error: 'server' });
  });
});
server.listen(PORT, () => {
  console.log(`Janath Cargo API on :${PORT} · db ${db.kind} · email ${mail.kind}${ADMIN_PASSWORD ? '' : ' · ADMIN_PASSWORD not set, dashboard locked'}`);
  drainQueue();
});
module.exports = { validate, normPhone, esc };
