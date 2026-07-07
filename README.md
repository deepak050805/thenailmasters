# The Nail Masters

The Nail Masters is a responsive static website for a premium nail and beauty studio in Sector 67, Mohali. The site helps visitors explore services, compare pricing, view studio work, read reviews, contact the salon, and book appointments through WhatsApp.

This project uses plain HTML, CSS, and JavaScript. There is no build step, framework, backend server, or database required.

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
- Animated preloader and cursor effects.
- Smooth scrolling with Lenis.
- Scroll-triggered reveal effects using GSAP, ScrollTrigger, and AOS.
- Swiper-powered testimonial carousel with continuous auto-scroll behavior.
- Gallery masonry rendering from JavaScript data with category filters and lightbox controls.
- SEO-friendly metadata, Open Graph tags, Twitter card tags, canonical URLs, and JSON-LD structured data.
- Mobile services dropdown handled by JavaScript.

## Tech Stack

- HTML5
- CSS3
- JavaScript
- GSAP
- GSAP ScrollTrigger
- AOS
- Swiper.js
- Lenis smooth scroll
- Google Fonts
- Google Maps embed/share links
- WhatsApp deep links

External libraries are loaded through CDN links in the HTML files.

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
  README.md
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
Handles the preloader, custom cursor, Lenis smooth scroll, AOS setup, header scroll state, mobile nav, brush animations, button ripple, GSAP reveals, gallery rendering/filtering/lightbox, Swiper testimonials, FAQ accordion, booking form WhatsApp handoff, and in-page anchor scrolling.

`services.js`
Handles mobile behavior for the services dropdown.

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

To update gallery items on the main page, edit the `galleryData` array in `main.js`.

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
