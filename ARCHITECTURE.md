# Static Architecture

The Nail Masters website is a static, CDN-friendly marketing website for a premium nail studio. It is intentionally not a web application, SaaS product, customer portal, or admin system.

## Current Architecture

- Plain HTML pages.
- Shared CSS in `style.css` and service-page CSS in `services.css`.
- Lightweight client-side JavaScript in `main.js` and `services.js`.
- No framework, build step, package manager, backend server, database, authentication, accounts, dashboards, WebSockets, workers, or custom API layer.
- Booking and contact forms open WhatsApp with a pre-filled message instead of storing customer data.
- External services are limited to public CDN assets, Google Fonts, Google Maps links/embeds, WhatsApp deep links, Instagram links, and public image URLs.

## Architectural Rule

Future work must preserve this static-first shape:

```text
Premium + Interactive + 3D + Responsive + Accessible + Secure + Fast + Static
```

Do not introduce app-style infrastructure unless an existing, explicitly required feature cannot be implemented safely without it.

Avoid adding:

- Customer authentication or accounts.
- Customer dashboards or portals.
- Admin dashboards.
- Complex databases or CMS infrastructure.
- Real-time systems or WebSockets.
- Background workers or microservices.
- Unnecessary server-side runtime dependencies.
- Unnecessary API layers.
- Complex global state management.

## Static-First Implementation Principles

- Prefer pre-rendered HTML and cacheable static assets.
- Keep JavaScript isolated to interactive components that need it.
- Keep dependencies minimal and loaded only when they provide clear value.
- Preserve SEO metadata, structured data, canonical URLs, Open Graph tags, and readable content.
- Use progressive enhancement for menus, galleries, accordions, modals, carousels, animations, and 3D effects.
- Respect `prefers-reduced-motion` for non-essential animation.
- Avoid effects that harm Core Web Vitals, mobile responsiveness, or initial rendering.

## Security Requirements

- Never commit API keys, private tokens, service credentials, database URLs, or secrets.
- Never place private credentials in browser JavaScript, HTML, CSS, public assets, or generated static output.
- Any future integration requiring secrets must use a secure server-side handoff or trusted third-party flow without exposing secrets to the browser.
- Do not rely on hidden frontend routes for security.
- Public pages and public assets can remain public.
- Sensitive/private resources must never be bundled into the frontend.

## Performance Requirements

- Keep initial render fast on mobile.
- Use lazy loading for non-critical images and media.
- Keep animations GPU-friendly, focused on `transform` and `opacity` where possible.
- Avoid heavy 3D as a page dependency; load decorative 3D progressively and provide light fallbacks.
- Do not add large dependencies for small visual effects.

## Pre-Release Static Audit

Before publishing, check:

- No `.env`, credential, token, private URL, or secret-like value is present in committed files.
- No new backend/server/database/auth/dashboard code was introduced.
- Forms still use static-safe handoff behavior unless a secure external service was explicitly approved.
- Public links, WhatsApp CTAs, map links, gallery, testimonials, and mobile navigation still work.
- Pages remain openable as static files or from a basic static server.
- Mobile layouts have no horizontal overflow at 320px, 360px, 375px, 390px, 412px, and 430px.
- Desktop layouts remain polished at 1280px, 1440px, 1600px, and 1920px.
