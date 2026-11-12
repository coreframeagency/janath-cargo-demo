// Sending email. Off until an account is connected; sign-ups wait as "pending" and go out once it is.
//   MAIL_TRANSPORT=gmail   GMAIL_USER, GMAIL_APP_PASSWORD   (a Janath Cargo Gmail with an app password)
//   MAIL_TRANSPORT=resend  RESEND_API_KEY, MAIL_FROM         (once Janath Cargo has its own domain)
//   MAIL_TRANSPORT=smtp    SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM
//   MAIL_TRANSPORT=file    writes each email to ./outbox (local testing)
const fs = require('fs');
const path = require('path');

function create(env) {
  const kind = (env.MAIL_TRANSPORT || '').toLowerCase();
  const fromName = env.MAIL_FROM_NAME || 'Janath Cargo';

  if (kind === 'gmail' && env.GMAIL_USER && env.GMAIL_APP_PASSWORD) {
    const nm = require('nodemailer');
    const tx = nm.createTransport({ service: 'gmail', auth: { user: env.GMAIL_USER, pass: env.GMAIL_APP_PASSWORD } });
    return { on: true, kind, from: env.GMAIL_USER, send: (m) => tx.sendMail({ ...m, from: { name: fromName, address: env.GMAIL_USER } }) };
  }
  if (kind === 'smtp' && env.SMTP_HOST && env.MAIL_FROM) {
    const nm = require('nodemailer');
    const port = Number(env.SMTP_PORT || 465);
    const tx = nm.createTransport({ host: env.SMTP_HOST, port, secure: port === 465, auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined });
    return { on: true, kind, from: env.MAIL_FROM, send: (m) => tx.sendMail({ ...m, from: { name: fromName, address: env.MAIL_FROM } }) };
  }
  if (kind === 'resend' && env.RESEND_API_KEY && env.MAIL_FROM) {
    return {
      on: true, kind, from: env.MAIL_FROM,
      async send(m) {
        const r = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: `${fromName} <${env.MAIL_FROM}>`, to: [m.to], subject: m.subject, html: m.html, text: m.text, headers: m.headers }),
        });
        if (!r.ok) throw new Error(`Resend ${r.status}: ${(await r.text()).slice(0, 200)}`);
        return r.json();
      },
    };
  }
  if (kind === 'file') {
    const dir = path.resolve(env.OUTBOX_DIR || 'outbox');
    fs.mkdirSync(dir, { recursive: true });
    return {
      on: true, kind, from: 'outbox',
      async send(m) {
        const f = path.join(dir, `${Date.now()}-${m.to.replace(/[^a-z0-9@.]/gi, '_')}`);
        fs.writeFileSync(f + '.html', m.html); fs.writeFileSync(f + '.json', JSON.stringify({ to: m.to, subject: m.subject, headers: m.headers, text: m.text }, null, 1));
        return { file: f };
      },
    };
  }
  return { on: false, kind: 'off', from: null, send: async () => { throw new Error('Email is not connected yet'); } };
}

module.exports = { create };
