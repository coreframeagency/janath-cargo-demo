# Janath Cargo — website

Public website for Janath Cargo: door-to-door cargo to Sri Lanka from Israel and the Philippines. Built by COREFRAME.

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

1. Hero — route switch (Israel → Sri Lanka or Philippines → Sri Lanka), headline, quote form and a "Track a parcel" tab. Both open WhatsApp with the details filled in.
2. Routes — one card per route: collection areas and usual delivery time.
3. How it works — four steps beside a route map. On desktop the section pins and the map follows the selected route as you scroll.
4. Customer portal — real screens from the Janath Cargo portal with sample data, marked "Launching soon".
5. About, Reviews, Help (questions and items we can't send), Offices, Instagram, Contact.

The route switch changes the headline, form, steps, map and WhatsApp messages, and is remembered. `?from=ph` opens the Philippines route; `?lang=si` opens Sinhala.

Details still to come from Janath Cargo are shown on the page as amber dashed "To confirm" chips.

## Map

Coastlines come from Natural Earth 1:50m land (public domain). Land and sea only — no country borders. The route lines are schematic arcs, not shipping lanes or port itineraries.

## Hosting

Render static site `janath-cargo-site`, branch `website`, publish directory `site`, no build command. Every push to `website` deploys.

## Contact number

Every WhatsApp button uses `972547415262` (+972 54-741-5262). It is set in `site/assets/js/site.js` (`WA`) and in the `href` attributes in `index.html`.

## Content rules

No invented prices, transit times, partners, reviews or statistics. The customer portal is shown as launching soon until it is open to customers.
