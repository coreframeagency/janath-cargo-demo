# Janath Cargo — website

Public website for Janath Cargo: door-to-door cargo from Israel to Sri Lanka. Built by COREFRAME.

Static site, no build step. Everything that is served lives in `site/`.

```
site/
  index.html            the page (English is the source text; the route map is inline SVG)
  404.html              not-found page
  assets/css/site.css   styles: Janath palette, Gemunu Libre / Figtree / Noto Sans Sinhala
  assets/js/i18n.js     Sinhala text and WhatsApp messages (English + Sinhala)
  assets/js/site.js     language switch, quote form, header, scroll effects, photo slots
  assets/fonts/         self-hosted subsets of the brand fonts (SIL OFL)
  assets/img/           logo files and share image
  assets/art/           photo-style placeholders shown until real photos arrive
  assets/photos/        drop photos here — see PHOTOS.md
```

## Page

1. Hero — headline, one-line summary, quote form (opens WhatsApp with the details filled in) and a parcel-update tab.
2. How it works — four steps beside a route map. On desktop the section pins and the map moves from Israel to Sri Lanka as you scroll.
3. What you send — "More than a box."
4. Questions — cost, timing, what can be sent, areas covered.
5. Contact — WhatsApp.

Each fact appears once. Scroll effects switch off for visitors who ask their device for reduced motion.

## Map

Coastlines come from Natural Earth 1:50m land (public domain). Land and sea only — no country borders. The route line is a schematic arc between the two countries, not a shipping lane or port itinerary.

## Hosting

Render static site `janath-cargo-site`, branch `website`, publish directory `site`, no build command. Every push to `website` deploys.

## Contact number

Every WhatsApp button uses `972547415262` (+972 54-741-5262). It is set in `site/assets/js/site.js` (`WA`) and in the `href` attributes in `index.html`.

## Languages

English is written in `index.html`. Sinhala lives in `site/assets/js/i18n.js`, keyed by each element's `data-i18n` value. The switch remembers the visitor's choice, and `?lang=si` opens the page in Sinhala. Lines taken from the approved social brief are used as written; the rest needs a check by a fluent reader before launch.

## Content rules

No invented prices, transit times, partners, reviews or statistics. No claims of live tracking, customer portals or card payments until they actually exist.
