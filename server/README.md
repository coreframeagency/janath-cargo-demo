# Janath Cargo API

Saves update sign-ups from the website, sends the welcome email, handles unsubscribes, and serves Janath's dashboard at `/admin`.
This is the first piece of the Janath Cargo system: bookings, shipments, customers and messages will be added to the same service and dashboard later.

- Runtime: Node 20+, no framework (`node:http`). Dependencies: `pg`, `nodemailer`.
- Database: Neon Postgres, project `janath-cargo`, table `subscribers`. Without `DATABASE_URL` it runs on an in-memory store (local testing).
- Render: web service `janath-cargo-api`, build `cd server && npm install --omit=dev`, start `node server/index.js`.

## Environment

| Key | What it's for |
|---|---|
| `DATABASE_URL` | Neon connection string |
| `ADMIN_PASSWORD` | Dashboard password |
| `SESSION_SECRET` | Signs the dashboard login cookie |
| `SITE_URL` | The website, used for links and images in the email |
| `SITE_ORIGINS` | Comma-separated sites allowed to post sign-ups |
| `MAIL_TRANSPORT` | Leave unset until email is connected. Then `gmail`, `resend` or `smtp` |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | For `gmail`: a Janath Cargo Gmail and its app password |
| `RESEND_API_KEY`, `MAIL_FROM` | For `resend`, once Janath Cargo has its own domain |

While email is off, sign-ups are saved with the welcome email marked "Waiting". As soon as `MAIL_TRANSPORT` is set, the service sends the waiting emails (a few every 90 seconds) and new sign-ups get theirs within a couple of minutes.

## Routes

- `POST /api/subscribe`: name, email, country (`IL`, `LK`, `PH`), phone, lang, route. Rate-limited, honeypot field `company`.
- `GET /unsubscribe?t=…`: confirm page. `POST /unsubscribe/one-click?t=…`: one-click unsubscribe for mail apps.
- `/admin`: dashboard (password). `/admin/export.csv`, `/admin/email-preview?lang=en|si&country=IL|LK|PH`.
- `GET /health`

## Local

```
cd server && ADMIN_PASSWORD=dev MAIL_TRANSPORT=file node index.js   # emails are written to server/outbox
```
