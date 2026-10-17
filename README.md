# The Nail Masters

The Nail Masters is a responsive static website for a premium nail and beauty studio in Sector 67, Mohali. The site helps visitors explore services, compare pricing, view studio work, read reviews, contact the salon, and book appointments through WhatsApp.

This project uses plain HTML, CSS, and JavaScript. There is no build step, framework, backend server, or database required.

The architecture is intentionally static-first. Keep future work aligned with [ARCHITECTURE.md](ARCHITECTURE.md): preserve the site's premium interactive presentation while avoiding customer accounts, dashboards, unnecessary APIs, databases, server runtimes, or other application infrastructure.

## Project Overview

The website presents The Nail Masters as a polished salon brand with dedicated pages for each major service category. It includes SEO metadata, structured data, responsive layouts, animated page sections, gallery interactions, mobile navigation, booking forms, contact forms, floating WhatsApp/call actions, and Google Maps location access.

## Pages

- `index.html` - Main landing page / nail services page with hero content, services, gallery, testimonials, FAQ, CTA, footer, and mobile actions.
- `services.html` - All-services overview page linking to each dedicated service category.
- `booking.html` - Appointment booking page that sends booking details through WhatsApp.
- `contact.html` - Contact page with message form, studio address, phone, Instagram, hours, and map access.
- `services/nails.html` - Nail services, extensions, overlays, refills, nail art, and pricing.
- `services/beauty.html` - Beauty services including threading, waxing, dermaplaning, and body treatments.
- `services/manicure.html` - Manicure packages and hand-care treatments.
- `services/pedicure.html` - Pedicure packages and foot-care treatments.
- `services/cleanup.html` - Cleanup, bleach, D-Tan, O3+, organic, and Kanpeki treatments.
- `services/facial.html` - Facial treatments including basic, organic, Hydra, O3+, and Kanpeki.
- `services/eyelashes.html` - Eyelash extension services including classic, hybrid, volume, mega volume, and cat eye.

## Features

- Fully responsive layout for desktop, tablet, and mobile.
- Luxury salon visual style using custom CSS variables, serif headings, soft neutrals, and gold accents.
- Service-specific pages with pricing, durations, FAQs, related services, and booking CTAs.
- WhatsApp-based booking and contact handoff.
- Contact and booking forms that generate pre-filled WhatsApp messages.
- Google Maps location links for the studio address and map preview.
- Floating WhatsApp and call buttons.
- Sticky mobile action bar for quick booking, WhatsApp, and call access.
- Immediate rendering with a local responsive hero poster.
- Native smooth scrolling with reduced-motion support.
- GSAP entrance and scroll reveals with desktop perspective interactions.
- Reader-controlled Swiper reviews with keyboard navigation and full-review dialogs.
- Existing gallery images with keyboard/touch lightbox controls and preserved Instagram links.
- Mobile navigation with focus trapping, Escape support, and background scroll locking.
- SEO-friendly metadata, Open Graph tags, Twitter card tags, canonical URLs, and JSON-LD structured data.
- Mobile services dropdown handled by JavaScript.

## Tech Stack

- HTML5
- CSS3
- JavaScript
- GSAP
- GSAP ScrollTrigger
- Swiper.js
- Google Fonts
- Google Maps embed/share links
- WhatsApp deep links

GSAP, ScrollTrigger, Swiper, existing images, and fonts are served locally from `assets/`. There are no runtime package dependencies or required build tools.

## File Structure

```text
thenailmasters/
  index.html
  services.html
  booking.html
  contact.html
  style.css
  services.css
  main.js
  services.js
  premium.css
  motion.js
  hero-3d.js
  _headers
  README.md
  ARCHITECTURE.md
  assets/
  tools/
  services/
    nails.html
    beauty.html
    manicure.html
    pedicure.html
    cleanup.html
    facial.html
    eyelashes.html
```

## Main Files

`style.css`
Contains the base design system, homepage sections, navigation, buttons, gallery, testimonials, pricing, FAQ, contact forms, footer, floating actions, and responsive rules.

`services.css`
Contains styles for service pages, dropdown navigation, service menus, category cards, related services, image strips, and mobile service-page behavior.

`main.js`
Handles navigation, accessible dialogs, gallery viewing, review controls, FAQ buttons, validation, and safely encoded WhatsApp handoffs. Form details remain available if a popup is blocked; customers send and confirm requests in WhatsApp.

`services.js`
Handles desktop hover/focus and mobile disclosure behavior for the services dropdown, including accurate expanded states and Escape support.

## Running Locally

Because this is a static site, you can open `index.html` directly in a browser. For the best local experience, use a simple local server such as the VS Code Live Server extension.

Example local URL:

```text
http://127.0.0.1:5500/thenailmasters/index.html
```

## Booking Flow

The booking form collects:

- Name
- Phone
- Service
- Preferred date
- Preferred time
- Optional notes

When submitted, the form opens WhatsApp with a pre-filled message to:

```text
+91 76968 84103
```

The contact form follows the same static-site pattern and is intended to hand off inquiries through WhatsApp rather than storing messages in a database.

## Location Link

The contact and booking pages use this Google Maps share link for external location opens:

```text
https://maps.app.goo.gl/Sv2ticWDZk9cAPgM8
```

The embedded map preview may use a Google Maps embed URL, while clicks on the address or map preview can open the share link above.

## SEO Notes

Most pages include:

- Page-specific `<title>`
- Meta description
- Canonical URL
- Open Graph metadata
- Twitter card metadata
- JSON-LD structured data

Service pages include schema for service/business context and FAQs where relevant.

## Editing Content

To update services or prices, edit the relevant HTML file inside `services/`.

To update gallery items, edit the existing `.insta-strip` images and links in the appropriate HTML page. Local image variants have explicit dimensions and responsive `srcset` attributes.

To update testimonials, edit the `.testiSwiper` slides in the relevant HTML pages.

To update the phone number or WhatsApp target, search for:

```text
917696884103
```

To update the Google Maps destination, search for:

```text
maps.app.goo.gl
```

## Design Notes

- Keep shared visual styling in `style.css`.
- Keep service-page extensions in `services.css`.
- Avoid changing repeated navigation/footer markup in only one page unless the same change is copied to the other pages that use it.
- Use relative paths carefully:
  - Root pages use `style.css`, `services.css`, `main.js`, and `services.js`.
  - Pages inside `services/` use `../style.css`, `../services.css`, `../main.js`, and `../services.js`.

## Browser Support

The site is intended for modern browsers that support:

- CSS Grid and Flexbox
- ES6 JavaScript
- IntersectionObserver
- Modern DOM APIs

Fallback behavior exists for some animation-related features, but the best experience is in current versions of Chrome, Edge, Safari, and Firefox.

Accessible menus and dialogs use the native HTML `dialog` element. Current evergreen browsers support it; the static content and external booking links remain available with JavaScript disabled.

## Optional Hero3D

`hero-3d.js` exposes a reusable `Hero3D` interface, mounted on `[data-hero-3d]`. The homepage ships with `data-spline-enabled="false"` and no scene or runtime URL. It renders the static poster without making Spline requests.

When a real scene is available, put the `.splinecode` file and its exported ES module runtime/dependencies under `assets/spline/`. Set `data-spline-src` and `data-spline-runtime` to their actual paths and set `data-spline-enabled="true"`. Alternatively, configure the mounted component:

```js
document.querySelector('[data-hero-3d]').hero3D.configure({
  enabled: true,
  sceneUrl: actualSceneUrl,
  runtimeUrl: actualRuntimeUrl
});
```

Only same-origin scene URLs or HTTPS `prod.spline.design` `.splinecode` URLs are accepted. Runtime modules must be same-origin. The loader waits for the hero to enter the viewport, verifies the scene, applies a timeout, and retains the poster on failure. It pauses the scene offscreen or in a hidden tab. Reduced motion, data saver, low-memory devices, mobile by default, and opening HTML via `file:` all use the poster. Enable `data-spline-mobile="true"` only after testing the real scene on mobile.

The optional scene is decorative; hero copy, links, and CTAs stay in accessible HTML. Future scene rendering and any additional CSP requirements must be tested against the real export.

## Static Packaging And QA

The source HTML can still be opened directly. Optional deployment packaging uses Node built-ins:

```sh
node tools/build-static.cjs
node tools/check-static.cjs
```

Deploy `dist/` as the public directory. The packaging allowlist excludes Git, tools, documentation, source image downloads, environment files, and QA artifacts. `_headers` supplies CSP, framing protection, referrer/permissions policies, and cache rules on hosts supporting that file. Configure equivalent HTTP response headers on other hosts; HTML alone cannot enforce response headers such as `frame-ancestors`.

`tools/qa.cjs` runs browser layout and interaction checks using Playwright as an optional development-only tool. It accepts an installed Playwright module path as its first argument, or resolves `playwright` normally. Reports and screenshots go into ignored `.qa/` files; its temporary local test server stops after checks.

`premium.css` contains shared visual refinements. `motion.js` owns GSAP motion and preference cleanup. The static site does not require a persistent local or production server.

## Business Information

**The Nail Masters**  
DSS No. 8, First Floor, Central Street, Sector-67  
S.A.S Nagar (Mohali), Punjab, India

Phone / WhatsApp:

```text
+91 76968 84103
```

Instagram:

```text
https://www.instagram.com/thenailmasters.in/
```

## Goal

The goal of this project is to provide a premium, mobile-friendly digital presence for The Nail Masters while making it easy for customers to discover services, trust the studio, and quickly book or contact through familiar channels like WhatsApp, phone, Instagram, and Google Maps.


## Nail Canvas and mood finder

The homepage includes a LUMÉ-inspired mood finder, six original illustrated starting looks,
and a five-finger Nail Canvas at `index.html#nail-canvas`. No new packages or runtime services.

- Choose each nail's shape, length, palette colour and finish; preview three skin tones.
- Add up to three details per nail. Drag to position, or use keyboard-accessible sliders.
- Undo/redo, copy a nail to the set, and local autosave. Storage failure keeps editing usable.
- Export a 1200 × 1500 PNG. This is an illustration, not a property photo or guaranteed result.
- Enquire with the design to populate the existing booking notes. The validated design travels
  in a URL fragment; the booking form still opens WhatsApp for the visitor to send.
- PNGs are downloaded locally and can be attached by the visitor in WhatsApp. They are not uploaded automatically.
- Artwork, suitability, prices and availability are confirmed by the studio.

Open `index.html` directly, or run `python -m http.server 8080 --bind 127.0.0.1` from this folder,
then visit `http://127.0.0.1:8080/`. Build and audit with `node tools/build-static.cjs`,
`node tools/check-static.cjs` and `node tools/check-nail-canvas.cjs`.

`nail-design.js` owns the validated shared model and SVG renderer; `nail-canvas.js` owns homepage
interactions; `nail-booking.js` handles booking prefill; `nail-canvas.css` is scoped to the new experience.


## Serene Luxe visual direction

The visual adaptation references Lumex Agency's **Nails Salon Website | Serene Luxe**:
https://www.behance.net/gallery/226745981/Nails-Salon-Website-Serene-Luxe
The designer's public Serene Luxe presentation on Dribbble was used to inspect its photographic
composition and burgundy/white palette when Behance blocked direct access:
https://dribbble.com/shots/25793065-Serene-Luxe-Spa

The Nail Masters retains its own identity, content, contact details and interactive Canvas.
`serene-luxe.css` provides the shared wine/cream theme and responsive editorial composition;
`serene-luxe.js` adds reversible, scroll-linked hero image movement with reduced-motion support.
Existing local images are reused as illustrative references; no reference-site photography or
branding is shipped. Gallery lightboxes, mood matching and the design-to-booking flow remain intact.
The optional build still uses `node tools/build-static.cjs`; no packages are needed to serve the site.


The opening hero uses the user-supplied CloudFront MP4 as a muted, inline, looping background.
`assets/images/hero-video-poster.jpg` is a lightweight still extracted from the same clip.
Reduced-motion visitors see the still without loading the video; blocked playback/errors also
fall back to it. Playback pauses when the hero is offscreen or the tab is hidden. A pause/play
control becomes visible on keyboard focus. The media CSP permits only the supplied CDN and self.


Responsive behaviour is shared across all pages in `serene-luxe.css`: fluid gutters and headings,
safe-area-aware fullscreen film, landscape layout, compact desktop navigation, one-column tablet
Canvas, stacked mobile forms and a responsive footer. All pages allow normal browser zoom.
Video backgrounds use `object-fit: cover`, so their edges can crop to fill different aspect ratios.
For visual QA, check 320/360/390/430px phones, 768/820/960px tablets, 1080/1280/1440/1920px desktops,
landscape phones and 200% browser zoom. Interaction/model checks do not replace device visual QA.


The **Colour, in motion** section between the gallery and mood board embeds the user-supplied
Pinterest nail-care animation with creator credit (BETER) and a direct source link:
https://www.pinterest.com/pin/3025924745623576/ . The supplied short link redirects through a
saved pin whose public metadata identifies this canonical pin. The official Pinterest iframe
loads lazily, keeps playback controls/source attribution, and needs no third-party script on
our page. The frame CSP permits `https://assets.pinterest.com` alongside the existing map host.
Pinterest availability can affect the player; the source link remains available below it.
