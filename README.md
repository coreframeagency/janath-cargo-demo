# Janath Cargo — website

Public website for Janath Cargo: door-to-door cargo from Israel to Sri Lanka and to the Philippines. Built by COREFRAME.

Static site, no build step. Everything that is served lives in `site/`.

```
site/
  index.html            the page (English is the source text; the route map is inline SVG)
  404.html              not-found page
  assets/css/site.css   styles: Janath palette, Gemunu Libre / Figtree / Noto Sans Sinhala
  assets/js/i18n.js     Sinhala text, Philippines-route English text, WhatsApp messages
  assets/js/site.js     route switch, language switch, quote form, header, scroll effects, photo slots
  assets/fonts/         self-hosted subsets of the brand fonts (SIL OFL)
  assets/img/           logo files, share image, customer-portal screens
  assets/photos/        drop photos here — see PHOTOS.md
```

## Page

1. Hero — route switch (Israel → Sri Lanka or Israel → Philippines), headline, quote form and a "Track a parcel" tab. Both open WhatsApp with the details filled in.
2. Routes — one card per destination: delivery areas and usual delivery time.
3. How it works — four steps beside a route map. For Israel → Sri Lanka the section pins on desktop and the map animates as you scroll; for Israel → Philippines it shows a still map of that route.
3b. The doorstep — full-screen photo of the delivery reaching the family. The framed photo opens to full screen while the section is pinned, then the line "Every parcel has someone waiting at the other end." appears.
4. Customer portal — real screens from the Janath Cargo portal with sample data, marked "Launching soon".
5. About, Reviews, Help (questions and items we can't send), Offices, Contact.

Scrolling: on a mouse or trackpad, wheel scrolling glides (eased in `site.js`) and every scroll effect is drawn in the same frame. Touch, keyboard, scrollbar and in-page links keep the browser's own scrolling. Parallax and the sliding contact headline run as CSS scroll-driven animations where the browser supports them (`html.sda`), otherwise `site.js` draws the same motion. Layout is measured on load, resize and content changes, never during scroll. With reduced motion turned on, nothing moves or pins.

The route switch changes the hero line, form, steps, map and WhatsApp messages, and is remembered. `?to=ph` opens the Israel → Philippines route; `?lang=si` opens Sinhala. A Philippines version of the doorstep photo (`05-doorstep-ph.jpg`, `05-doorstep-ph-tall.jpg`) is used on that route if the files are added.

Details still to come from Janath Cargo are shown on the page as amber dashed "To confirm" chips.

Instagram and Facebook show "link to confirm" in the footer. When the Instagram handle is confirmed, replace that footer chip with a link and un-comment the Instagram link in the top bar of `index.html`.

## Map

Coastlines come from Natural Earth 1:50m land (public domain). Land and sea only — no country borders. The route lines are schematic arcs, not shipping lanes or port itineraries.

## Hosting

Render static site `janath-cargo-site`, branch `website`, publish directory `site`, no build command. Every push to `website` deploys.

## Contact number

Every WhatsApp button uses `972547415262` (+972 54-741-5262). It is set in `site/assets/js/site.js` (`WA`) and in the `href` attributes in `index.html`.

## Content rules

No invented prices, transit times, partners, reviews or statistics. The customer portal is shown as launching soon until it is open to customers.
