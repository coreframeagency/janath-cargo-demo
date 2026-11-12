// Storage for update sign-ups. Postgres (Neon) when DATABASE_URL is set; an in-memory store for local runs.
const crypto = require('crypto');

const TZ = 'Asia/Jerusalem'; // day boundaries for the dashboard follow Janath's working day in Israel
const token = () => crypto.randomBytes(24).toString('base64url');

/* ---------- Postgres ---------- */
function pgStore(url) {
  const { Pool } = require('pg');
  // TLS is set here rather than through libpq-style URL flags (sslmode, channel_binding), which pg reads differently.
  const u = new URL(url); u.searchParams.delete('sslmode'); u.searchParams.delete('channel_binding');
  const pool = new Pool({ connectionString: u.toString(), max: 5, idleTimeoutMillis: 30000, connectionTimeoutMillis: 15000, ssl: { rejectUnauthorized: true } });
  pool.on('error', (e) => console.error('db pool error', e.message));
  const q = (sql, p) => pool.query(sql, p).then((r) => r.rows);
  const COLS = 'id, name, email, country, phone, lang, route, source, welcome_status, welcome_sent_at, welcome_error, unsubscribed_at, created_at';

  return {
    kind: 'postgres',
    async ping() { await q('SELECT 1'); return true; },

    // New sign-up, or the existing row for that email. Someone who had unsubscribed and signs up again is re-joined.
    async add(s) {
      const found = await q(`SELECT ${COLS}, unsub_token FROM subscribers WHERE lower(email) = lower($1)`, [s.email]);
      if (found.length) {
        const row = found[0];
        if (!row.unsubscribed_at) return { row, existed: true };
        const [re] = await q(
          `UPDATE subscribers SET name=$2, country=$3, phone=$4, lang=$5, route=$6, unsubscribed_at=NULL,
             welcome_status = CASE WHEN welcome_status='sent' THEN 'sent' ELSE 'pending' END, updated_at=now()
           WHERE id=$1 RETURNING ${COLS}, unsub_token`, [row.id, s.name, s.country, s.phone, s.lang, s.route]);
        return { row: re, existed: false, rejoined: true };
      }
      const [row] = await q(
        `INSERT INTO subscribers (name, email, country, phone, lang, route, source, unsub_token)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING ${COLS}, unsub_token`,
        [s.name, s.email, s.country, s.phone, s.lang, s.route, s.source || 'website', token()]);
      return { row, existed: false };
    },

    async get(id) { const r = await q(`SELECT ${COLS}, unsub_token FROM subscribers WHERE id=$1`, [id]); return r[0] || null; },

    async setWelcome(id, status, error) {
      await q(`UPDATE subscribers SET welcome_status=$2, welcome_error=$3,
                 welcome_sent_at = CASE WHEN $2='sent' THEN now() ELSE welcome_sent_at END, updated_at=now() WHERE id=$1`,
        [id, status, error ? String(error).slice(0, 500) : null]);
    },

    async pending(limit) {
      return q(`SELECT ${COLS}, unsub_token FROM subscribers
                WHERE welcome_status='pending' AND unsubscribed_at IS NULL ORDER BY created_at LIMIT $1`, [limit]);
    },

    async unsubscribe(t) {
      const r = await q(`UPDATE subscribers SET unsubscribed_at = COALESCE(unsubscribed_at, now()), updated_at=now()
                         WHERE unsub_token=$1 RETURNING id, name, lang`, [t]);
      return r[0] || null;
    },
    async byToken(t) { const r = await q('SELECT id, name, lang, unsubscribed_at FROM subscribers WHERE unsub_token=$1', [t]); return r[0] || null; },

    async stats() {
      const [tot] = await q(`SELECT
          count(*) FILTER (WHERE unsubscribed_at IS NULL)::int AS active,
          count(*) FILTER (WHERE unsubscribed_at IS NOT NULL)::int AS unsubscribed,
          count(*) FILTER (WHERE unsubscribed_at IS NULL AND created_at >= now() - interval '7 days')::int AS week,
          count(*) FILTER (WHERE unsubscribed_at IS NULL AND created_at >= now() - interval '14 days' AND created_at < now() - interval '7 days')::int AS prev_week,
          count(*) FILTER (WHERE unsubscribed_at IS NULL AND welcome_status='pending')::int AS waiting,
          count(*) FILTER (WHERE welcome_status='failed')::int AS failed,
          count(*) FILTER (WHERE welcome_status='sent')::int AS sent
        FROM subscribers`);
      const byCountry = await q(`SELECT country, count(*)::int AS n FROM subscribers WHERE unsubscribed_at IS NULL GROUP BY country`);
      const byLang = await q(`SELECT lang, count(*)::int AS n FROM subscribers WHERE unsubscribed_at IS NULL GROUP BY lang`);
      const days = await q(`SELECT to_char(d, 'YYYY-MM-DD') AS day, coalesce(c.n, 0)::int AS n
        FROM generate_series((now() AT TIME ZONE '${TZ}')::date - 29, (now() AT TIME ZONE '${TZ}')::date, interval '1 day') AS d
        LEFT JOIN (SELECT (created_at AT TIME ZONE '${TZ}')::date AS day, count(*) AS n FROM subscribers
                   WHERE created_at >= now() - interval '31 days' GROUP BY 1) c ON c.day = d::date
        ORDER BY d`);
      return { ...tot, byCountry: Object.fromEntries(byCountry.map((r) => [r.country, r.n])), byLang: Object.fromEntries(byLang.map((r) => [r.lang, r.n])), days };
    },

    async list({ q: search, country, status, limit = 50, offset = 0 }) {
      const where = [], p = [];
      if (search) { p.push(`%${search.toLowerCase()}%`); where.push(`(lower(name) LIKE $${p.length} OR lower(email) LIKE $${p.length} OR phone LIKE $${p.length})`); }
      if (country) { p.push(country); where.push(`country = $${p.length}`); }
      if (status === 'left') where.push('unsubscribed_at IS NOT NULL');
      else if (status === 'all') { /* everyone */ }
      else where.push('unsubscribed_at IS NULL');
      const w = where.length ? 'WHERE ' + where.join(' AND ') : '';
      const [{ n }] = await q(`SELECT count(*)::int AS n FROM subscribers ${w}`, p);
      const rows = await q(`SELECT ${COLS} FROM subscribers ${w} ORDER BY created_at DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`, p);
      return { rows, total: n };
    },
  };
}

/* ---------- memory (local runs and tests) ---------- */
function memoryStore() {
  const rows = []; let seq = 0;
  const pub = (r) => { const { unsub_token, ...rest } = r; return rest; };
  const isoDay = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d);
  return {
    kind: 'memory',
    async ping() { return true; },
    async add(s) {
      const row = rows.find((r) => r.email.toLowerCase() === s.email.toLowerCase());
      if (row && !row.unsubscribed_at) return { row: { ...row }, existed: true };
      if (row) { Object.assign(row, { name: s.name, country: s.country, phone: s.phone, lang: s.lang, route: s.route, unsubscribed_at: null, welcome_status: row.welcome_status === 'sent' ? 'sent' : 'pending' }); return { row: { ...row }, existed: false, rejoined: true }; }
      const r = { id: String(++seq), name: s.name, email: s.email, country: s.country, phone: s.phone, lang: s.lang, route: s.route || null, source: s.source || 'website', welcome_status: 'pending', welcome_sent_at: null, welcome_error: null, unsubscribed_at: null, created_at: s.created_at || new Date(), unsub_token: token() };
      rows.push(r); return { row: { ...r }, existed: false };
    },
    async get(id) { const r = rows.find((x) => x.id === String(id)); return r ? { ...r } : null; },
    async setWelcome(id, status, error) { const r = rows.find((x) => x.id === String(id)); if (r) { r.welcome_status = status; r.welcome_error = error || null; if (status === 'sent') r.welcome_sent_at = new Date(); } },
    async pending(limit) { return rows.filter((r) => r.welcome_status === 'pending' && !r.unsubscribed_at).slice(0, limit).map((r) => ({ ...r })); },
    async unsubscribe(t) { const r = rows.find((x) => x.unsub_token === t); if (!r) return null; r.unsubscribed_at = r.unsubscribed_at || new Date(); return { id: r.id, name: r.name, lang: r.lang }; },
    async byToken(t) { const r = rows.find((x) => x.unsub_token === t); return r ? { id: r.id, name: r.name, lang: r.lang, unsubscribed_at: r.unsubscribed_at } : null; },
    async stats() {
      const now = Date.now(), act = rows.filter((r) => !r.unsubscribed_at), age = (r) => now - new Date(r.created_at).getTime(), D = 864e5;
      const count = (f) => rows.filter(f).length, by = (k) => act.reduce((o, r) => ((o[r[k]] = (o[r[k]] || 0) + 1), o), {});
      const days = []; for (let i = 29; i >= 0; i--) { const day = isoDay(new Date(now - i * D)); days.push({ day, n: rows.filter((r) => isoDay(new Date(r.created_at)) === day).length }); }
      return { active: act.length, unsubscribed: rows.length - act.length, week: act.filter((r) => age(r) < 7 * D).length, prev_week: act.filter((r) => age(r) >= 7 * D && age(r) < 14 * D).length, waiting: act.filter((r) => r.welcome_status === 'pending').length, failed: count((r) => r.welcome_status === 'failed'), sent: count((r) => r.welcome_status === 'sent'), byCountry: by('country'), byLang: by('lang'), days };
    },
    async list({ q, country, status, limit = 50, offset = 0 }) {
      let r = rows.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      if (q) { const s = q.toLowerCase(); r = r.filter((x) => x.name.toLowerCase().includes(s) || x.email.toLowerCase().includes(s) || x.phone.includes(s)); }
      if (country) r = r.filter((x) => x.country === country);
      if (status === 'left') r = r.filter((x) => x.unsubscribed_at); else if (status !== 'all') r = r.filter((x) => !x.unsubscribed_at);
      return { rows: r.slice(offset, offset + limit).map(pub), total: r.length };
    },
  };
}

module.exports = { create: (url) => (url ? pgStore(url) : memoryStore()), TZ };
