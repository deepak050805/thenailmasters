/* Native background video and scroll motion; no additional runtime dependencies. */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', () => {
    const hero = document.querySelector('.sl-hero');
    if (!hero) return;
    const surface = hero.querySelector('.sl-hero-photo');
    const video = hero.querySelector('video');
    const toggle = hero.querySelector('.sl-video-toggle');
    if (video) {
      const preference = matchMedia('(prefers-reduced-motion: reduce)');
      let visible = !('IntersectionObserver' in window), pausedByVisitor = false, failed = false;
      const canPlay = () => visible && !document.hidden && !preference.matches && !pausedByVisitor && !failed;
      const updateToggle = () => {
        toggle.hidden = preference.matches || failed;
        toggle.textContent = pausedByVisitor ? 'Play background video' : 'Pause background video';
      };
      const sync = () => {
        updateToggle();
        if (!canPlay()) {
          video.pause();
          if (preference.matches || failed) surface.classList.remove('video-ready');
          return;
        }
        if (!video.getAttribute('src')) {
          video.muted = true;
          video.defaultMuted = true;
          video.src = video.dataset.src;
          video.load();
        }
        const playback = video.play();
        if (playback?.catch) playback.catch(() => surface.classList.remove('video-ready'));
      };
      video.addEventListener('playing', () => {
        if (canPlay()) surface.classList.add('video-ready');
        else video.pause();
      });
      video.addEventListener('error', () => { failed = true; sync(); });
      toggle.addEventListener('click', () => { pausedByVisitor = !pausedByVisitor; sync(); });
      document.addEventListener('visibilitychange', sync);
      preference.addEventListener('change', sync);
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
          visible = entries[0].isIntersecting;
          sync();
        }, { threshold:.05 });
        observer.observe(hero);
      }
      sync();
    }
    if (!window.gsap || !window.ScrollTrigger) return;
    window.gsap.registerPlugin(window.ScrollTrigger);
    const media = window.gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      // Move the shared surface so poster and video have identical positioning.
      window.gsap.fromTo(surface, { scale:1.01, yPercent:0 }, {
        scale:1.08, yPercent:5, ease:'none', scrollTrigger:{ trigger:hero, start:'top top', end:'bottom top', scrub:.7 }
      });
      window.gsap.to(hero.querySelector('h1'), {
        y:35, ease:'none', scrollTrigger:{ trigger:hero, start:'top top', end:'bottom top', scrub:.7 }
      });
    });
  });
})();
