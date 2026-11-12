// The welcome email: English or Sinhala (the language the person signed up in), with a block that fits their country.
// Table layout and inline styles so it holds up in Gmail, Outlook and phone mail apps.

// Sinhala rakaransaya / yansaya need a zero-width joiner after the virama (same rule as the site's i18n build).
const zwj = (s) => s.replace(/්‍/g, '්').replace(/්(?=[රය])/g, '්‍');
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Each route has its own desk: Philippines sign-ups get the Philippines desk, everyone else the Sri Lanka desk.
const DESKS = {
  il: [['972547415262', '+972 54-741-5262'], ['972549505979', '+972 54-950-5979']],
  ph: [['972545825163', '+972 54-582-5163'], ['972542136595', '+972 54-213-6595']],
};
const COUNTRY = {
  en: { IL: 'Israel', LK: 'Sri Lanka', PH: 'Philippines' },
  si: { IL: 'ඊශ්රායලය', LK: 'ශ්රී ලංකාව', PH: 'පිලිපීනය' },
};

const T = {
  en: {
    subject: 'Welcome to Janath Cargo.',
    pre: "You're on the list. Here's what you'll hear from us.",
    hello: (n) => `Welcome to Janath Cargo, ${n}.`,
    intro: "Thanks for joining. We'll write when there's something worth knowing: collection dates in Israel, delivery times, and news about our routes to Sri Lanka and the Philippines.",
    block: {
      IL: ['Ready to send a parcel?', 'Tell us your city and how many boxes. We collect from your door in Israel and deliver to your family’s door.', 'Message us on WhatsApp', "Hello Janath Cargo, I'd like to send a parcel from Israel."],
      LK: ['Family sending you a parcel?', 'Share our number with them in Israel. We collect from their home and deliver to your door in Sri Lanka.', 'Message us on WhatsApp', 'Hello Janath Cargo, I signed up for updates from Sri Lanka.'],
      PH: ['Family sending you a parcel?', 'Share our number with them in Israel. We collect from their home and deliver to your door in the Philippines.', 'Message us on WhatsApp', 'Hello Janath Cargo, I signed up for updates from the Philippines.'],
    },
    callOr: 'Call or WhatsApp',
    company: 'Ramla, Israel · Since 2008 · Registered with the Israel Tax Authority',
    details: 'Your details', name: 'Name', country: 'Country', phone: 'Phone',
    wrong: 'Something not right? Message us on WhatsApp and we’ll fix it.',
    sign: 'The Janath Cargo team',
    tagline: 'Door-to-door cargo from Israel to Sri Lanka and the Philippines.',
    why: 'You’re getting this email because you signed up for updates on the Janath Cargo website.',
    unsub: 'Unsubscribe',
  },
  si: {
    subject: 'Janath Cargo වෙත සාදරයෙන් පිළිගනිමු.',
    pre: 'ඔබ දැන් අපගේ යාවත්කාලීන ලැයිස්තුවට එක් වී සිටී.',
    hello: (n) => `${n}, Janath Cargo වෙත සාදරයෙන් පිළිගනිමු.`,
    intro: 'අප හා එක්වීම ගැන ස්තූතියි. ඊශ්රායලයේ භාණ්ඩ ලබාගන්නා දින, භාරදෙන කාලය, සහ ශ්රී ලංකාවට සහ පිලිපීනයට අපගේ මාර්ග ගැන පුවත් වැනි වැදගත් දේ ඇති විට අපි ඔබට ලියන්නෙමු.',
    block: {
      IL: ['පාර්සලයක් යැවීමට සූදානම්ද?', 'ඔබේ නගරය සහ පෙට්ටි ගණන අපට කියන්න. අපි ඊශ්රායලයේ ඔබේ නිවසින් ලබාගෙන ඔබේ පවුලේ අයගේ නිවසටම භාරදෙන්නෙමු.', 'WhatsApp පණිවිඩයක් එවන්න', 'ආයුබෝවන් Janath Cargo, මට ඊශ්රායලයේ සිට පාර්සලයක් යවන්න ඕනේ.'],
      LK: ['පවුලේ අය ඔබට පාර්සලයක් එවනවාද?', 'ඊශ්රායලයේ සිටින ඔවුන් සමඟ අපගේ අංකය බෙදාගන්න. අපි ඔවුන්ගේ නිවසින් ලබාගෙන ශ්රී ලංකාවේ ඔබේ නිවසටම භාරදෙන්නෙමු.', 'WhatsApp පණිවිඩයක් එවන්න', 'ආයුබෝවන් Janath Cargo, මම ශ්රී ලංකාවේ සිට යාවත්කාලීන සඳහා ලියාපදිංචි වුණා.'],
      PH: ['පවුලේ අය ඔබට පාර්සලයක් එවනවාද?', 'ඊශ්රායලයේ සිටින ඔවුන් සමඟ අපගේ අංකය බෙදාගන්න. අපි ඔවුන්ගේ නිවසින් ලබාගෙන පිලිපීනයේ ඔබේ නිවසටම භාරදෙන්නෙමු.', 'WhatsApp පණිවිඩයක් එවන්න', 'ආයුබෝවන් Janath Cargo, මම පිලිපීනයේ සිට යාවත්කාලීන සඳහා ලියාපදිංචි වුණා.'],
    },
    callOr: 'අමතන්න හෝ WhatsApp',
    company: 'රම්ලා, ඊශ්රායලය · 2008 සිට · ඊශ්රායල බදු අධිකාරියේ ලියාපදිංචි',
    details: 'ඔබේ විස්තර', name: 'නම', country: 'රට', phone: 'දුරකථන අංකය',
    wrong: 'යමක් වැරදිද? WhatsApp හරහා අපට පණිවිඩයක් එවන්න, අපි නිවැරදි කරන්නෙමු.',
    sign: 'Janath Cargo කණ්ඩායම',
    tagline: 'ඊශ්රායලයේ සිට ශ්රී ලංකාවට සහ පිලිපීනයට ගෙයින් ගෙට භාණ්ඩ.',
    why: 'Janath Cargo වෙබ් අඩවියේ යාවත්කාලීන සඳහා ඔබ ලියාපදිංචි වූ නිසා මෙම ඊමේල් ලැබේ.',
    unsub: 'ලැයිස්තුවෙන් ඉවත් වන්න',
  },
};

const fmtPhone = (p) => { const m = String(p || '').match(/^\+(972|94|63)(\d+)$/); if (!m) return String(p || ''); const d = m[2], a = m[1] === '63' ? 3 : 2; return `+${m[1]} ${d.slice(0, a)} ${d.slice(a, a + 3)} ${d.slice(a + 3)}`.trim(); };
const firstName = (n) => String(n || '').trim().split(/\s+/)[0] || '';

/**
 * @param {object} s   subscriber row (name, email, country, phone, lang, unsub_token)
 * @param {object} cfg { siteUrl, apiUrl }
 */
function welcome(s, cfg) {
  const L = s.lang === 'si' ? 'si' : 'en';
  const t = T[L], z = L === 'si' ? zwj : (x) => x;
  const country = ['IL', 'LK', 'PH'].includes(s.country) ? s.country : 'IL';
  const [bTitle, bText, bCta, bMsg] = t.block[country];
  const desk = DESKS[country === 'PH' || (country === 'IL' && s.route === 'ph') ? 'ph' : 'il'];   // Israel senders on the Philippines route get that desk too
  const wa = `https://wa.me/${desk[0][0]}?text=${encodeURIComponent(z(bMsg))}`;
  const nums = desk.map(([n, show]) => `<a href="tel:+${n}" style="color:#10243E;font-weight:600;text-decoration:none;white-space:nowrap;">${show}</a>`).join(' &nbsp;·&nbsp; ');
  const numsText = desk.map((d) => d[1]).join(' · ');
  const unsubUrl = `${cfg.apiUrl}/unsubscribe?t=${encodeURIComponent(s.unsub_token)}`;
  const site = cfg.siteUrl.replace(/\/$/, '');
  const logo = `${site}/assets/img/logo-primary.png`;
  const photo = `${site}/assets/photos/05-doorstep.jpg`;
  const fn = firstName(s.name);
  const font = L === 'si'
    ? "'Noto Sans Sinhala','Iskoola Pota',Arial,sans-serif"
    : "Figtree,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
  const head = L === 'si' ? font : "'Gemunu Libre',Impact,'Arial Narrow Bold',Arial,sans-serif";

  const subject = z(t.subject);
  const html = `<!doctype html>
<html lang="${L}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light">
<title>${esc(subject)}</title>
<style>
@media (max-width:620px){.px{padding-left:24px!important;padding-right:24px!important}.h1{font-size:30px!important}.btn a{display:block!important}}
a{color:#2071C9}
</style></head>
<body style="margin:0;padding:0;background:#E7F4FA;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#E7F4FA">${esc(z(t.pre))}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#E7F4FA;">
<tr><td align="center" style="padding:32px 12px;">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background:#FFFFFF;border-radius:8px;overflow:hidden;">
  <tr><td style="background:#10243E;padding:24px 40px;" class="px">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
      <td style="background:#FFFFFF;border-radius:8px;padding:6px 10px;"><img src="${logo}" width="40" height="48" alt="Janath Cargo" style="display:block;border:0;width:40px;height:48px;"></td>
      <td style="padding-left:14px;font-family:${font};font-size:13px;line-height:1.4;color:rgba(231,244,250,.72);">${esc(z(t.tagline))}</td>
    </tr></table>
  </td></tr>
  <tr><td><img src="${photo}" width="600" alt="" style="display:block;width:100%;max-width:600px;height:auto;border:0;"></td></tr>
  <tr><td style="padding:40px 40px 8px;" class="px">
    <h1 class="h1" style="margin:0 0 16px;font-family:${head};font-weight:800;font-size:36px;line-height:${L === 'si' ? '1.3' : '1.05'};color:#10243E;">${esc(z(t.hello(fn)).replace(/\.$/, ''))}<span style="color:#D8A24C;">.</span></h1>
    <p style="margin:0;font-family:${font};font-size:17px;line-height:1.6;color:rgba(16,36,62,.78);">${esc(z(t.intro))}</p>
  </td></tr>
  <tr><td style="padding:24px 40px 8px;" class="px">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F5FAFD;border:1px solid rgba(16,36,62,.12);border-left:3px solid #D8A24C;border-radius:8px;">
      <tr><td style="padding:24px;">
        <p style="margin:0 0 8px;font-family:${head};font-weight:700;font-size:22px;line-height:1.2;color:#10243E;">${esc(z(bTitle))}</p>
        <p style="margin:0 0 20px;font-family:${font};font-size:16px;line-height:1.55;color:rgba(16,36,62,.78);">${esc(z(bText))}</p>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" class="btn"><tr><td style="background:#D8A24C;border-radius:4px;">
          <a href="${esc(wa)}" style="display:inline-block;padding:14px 22px;font-family:${font};font-weight:600;font-size:16px;line-height:1.2;color:#10243E;text-decoration:none;">${esc(z(bCta))} &rarr;</a>
        </td></tr></table>
        <p style="margin:12px 0 0;font-family:${font};font-size:14px;line-height:1.6;color:rgba(16,36,62,.6);">${esc(z(t.callOr))}: ${nums}</p>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:24px 40px 8px;" class="px">
    <p style="margin:0 0 8px;font-family:${font};font-size:13px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:rgba(16,36,62,.55);">${esc(z(t.details))}</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-family:${font};font-size:15px;line-height:1.5;color:#10243E;">
      <tr><td style="padding:8px 0;border-top:1px solid rgba(16,36,62,.12);width:38%;color:rgba(16,36,62,.6);">${esc(z(t.name))}</td><td style="padding:8px 0;border-top:1px solid rgba(16,36,62,.12);">${esc(s.name)}</td></tr>
      <tr><td style="padding:8px 0;border-top:1px solid rgba(16,36,62,.12);color:rgba(16,36,62,.6);">${esc(z(t.country))}</td><td style="padding:8px 0;border-top:1px solid rgba(16,36,62,.12);">${esc(z(COUNTRY[L][country]))}</td></tr>
      <tr><td style="padding:8px 0;border-top:1px solid rgba(16,36,62,.12);border-bottom:1px solid rgba(16,36,62,.12);color:rgba(16,36,62,.6);">${esc(z(t.phone))}</td><td style="padding:8px 0;border-top:1px solid rgba(16,36,62,.12);border-bottom:1px solid rgba(16,36,62,.12);">${esc(fmtPhone(s.phone))}</td></tr>
    </table>
    <p style="margin:12px 0 0;font-family:${font};font-size:14px;line-height:1.5;color:rgba(16,36,62,.6);">${esc(z(t.wrong))}</p>
  </td></tr>
  <tr><td style="padding:32px 40px 40px;" class="px">
    <p style="margin:0;font-family:${font};font-size:16px;line-height:1.5;color:#10243E;font-weight:600;">${esc(z(t.sign))}</p>
  </td></tr>
  <tr><td style="background:#10243E;padding:24px 40px;" class="px">
    <p style="margin:0 0 8px;font-family:${font};font-size:13px;line-height:1.55;color:rgba(231,244,250,.72);">Janath Cargo · ${esc(z(t.company))}<br><a href="${site}/" style="color:rgba(231,244,250,.9);">${esc(site.replace(/^https?:\/\//, ''))}</a> · ${esc(z(t.callOr))} ${desk[0][1]}</p>
    <p style="margin:0;font-family:${font};font-size:13px;line-height:1.55;color:rgba(231,244,250,.58);">${esc(z(t.why))} <a href="${esc(unsubUrl)}" style="color:#D8A24C;">${esc(z(t.unsub))}</a></p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  const text = [
    z(t.hello(fn)), '', z(t.intro), '',
    z(bTitle), z(bText), `${z(bCta)}: ${wa}`, `${z(t.callOr)}: ${numsText}`, '',
    `${z(t.details)}`, `${z(t.name)}: ${s.name}`, `${z(t.country)}: ${z(COUNTRY[L][country])}`, `${z(t.phone)}: ${fmtPhone(s.phone)}`, z(t.wrong), '',
    z(t.sign), '', '—', `Janath Cargo · ${z(t.company)}`, site, z(t.why), `${z(t.unsub)}: ${unsubUrl}`,
  ].join('\n');

  return { subject, html, text, unsubUrl };
}

module.exports = { welcome, zwj, esc, COUNTRY };
