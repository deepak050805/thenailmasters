document.addEventListener('DOMContentLoaded', () => {
  // Mobile: tap "Services" trigger row to expand/collapse dropdown instead of navigating
  const dd = document.getElementById('servicesDropdown');
  if (!dd) return;
  const trigger = dd.querySelector('.dropdown-trigger');
  const link = trigger.querySelector('a');

  function isMobile() { return window.matchMedia('(max-width: 1080px)').matches; }

  trigger.addEventListener('click', (e) => {
    if (isMobile()) {
      e.preventDefault();
      dd.classList.toggle('open');
    }
  });

  // Close mobile dropdown when a sub-link is clicked (so nav also closes via existing main.js listener)
  dd.querySelectorAll('.nav-dropdown a').forEach(a => {
    a.addEventListener('click', () => { dd.classList.remove('open'); });
  });
});
