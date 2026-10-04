(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', () => {
    const gsap = window.gsap;
    if (!gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(window.ScrollTrigger);
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const hero = document.querySelector('[data-hero-content], .svc-hero-grid > div:first-child, .svc-hero > .container');
      if (hero) {
        gsap.from(hero.children, {
          y: 22, autoAlpha: 0, duration: 0.7, stagger: 0.09, ease: 'power3.out', clearProps: 'opacity,visibility,transform'
        });
      }
      document.querySelectorAll('[data-aos], .section-head, .menu-card, .cat-card').forEach(el => {
        if (el.closest('.svc-hero, .studio-hero') || el.matches('.testiSwiper')) return;
        gsap.from(el, {
          y: 20, autoAlpha: 0, duration: 0.55, ease: 'power2.out', clearProps: 'opacity,visibility,transform',
          scrollTrigger: { trigger: el, start: 'top 94%', once: true }
        });
      });
    });
    media.add('(min-width: 1081px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
      const cleanups = [];
      document.querySelectorAll('.svc-hero-visual, [data-hero-motion]').forEach(stage => {
        const target = stage.querySelector('.svc-hero-frame, .hero-fallback');
        if (!target) return;
        const surface = stage.closest('.studio-hero') || stage;
        const x = gsap.quickTo(target, 'rotationY', { duration: 0.55, ease: 'power2.out' });
        const y = gsap.quickTo(target, 'rotationX', { duration: 0.55, ease: 'power2.out' });
        const move = event => {
          const bounds = surface.getBoundingClientRect();
          x(((event.clientX - bounds.left) / bounds.width - 0.5) * 4);
          y(-((event.clientY - bounds.top) / bounds.height - 0.5) * 4);
        };
        const leave = () => { x(0); y(0); };
        surface.addEventListener('pointermove', move, { passive: true });
        surface.addEventListener('pointerleave', leave);
        cleanups.push(() => {
          surface.removeEventListener('pointermove', move);
          surface.removeEventListener('pointerleave', leave);
          gsap.set(target, { clearProps: 'transform' });
        });
      });
      return () => cleanups.forEach(cleanup => cleanup());
    });
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
  });
})();
