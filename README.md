# Janath Cargo — website

Public website for Janath Cargo: door-to-door cargo from Israel to Sri Lanka. Built by COREFRAME.

Static site, no build step. Everything that is served lives in `site/`.

```
site/
  index.html            the page (English is the source text)
  404.html              not-found page
  assets/css/site.css   styles: Janath palette, Gemunu Libre / Figtree / Noto Sans Sinhala
  assets/js/i18n.js     Sinhala text and WhatsApp messages (English + Sinhala)
  assets/js/site.js     language switch, quote widget, header, menu, photo slots
  assets/fonts/         self-hosted subsets of the brand fonts (SIL OFL)
  assets/img/           logo files and share image
  assets/art/           illustrations shown until photos arrive
  assets/photos/        drop photos here — see PHOTOS.md
```

## Hosting

Render static site, branch `website`, publish directory `site`, no build command. Every push to `website` deploys.

## Contact number

Every WhatsApp button uses `972547415262` (+972 54-741-5262). It is set in `site/assets/js/site.js` (`WA`) and in the `href` attributes in `index.html`.

## Languages

English is written in `index.html`. Sinhala lives in `site/assets/js/i18n.js`, keyed by each element's `data-i18n` value. The switch remembers the visitor's choice, and `?lang=si` opens the page in Sinhala.

The Sinhala needs a check by a fluent reader before launch.

## Content rules

No invented prices, transit times, partners, reviews or statistics. No claims of live tracking, customer portals or card payments until they actually exist.
