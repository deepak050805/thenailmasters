document.addEventListener('DOMContentLoaded', () => {
  const dropdown = document.getElementById('servicesDropdown');
  if (!dropdown) return;
  const row = dropdown.querySelector('.dropdown-trigger');
  const menu = dropdown.querySelector('.nav-dropdown');
  const toggle = document.createElement('button');
  toggle.className = 'dropdown-toggle';
  toggle.type = 'button';
  toggle.setAttribute('aria-label', 'Show service categories');
  toggle.setAttribute('aria-expanded', 'false');
  menu.id = 'serviceCategories';
  toggle.setAttribute('aria-controls', menu.id);
  toggle.append(row.querySelector('svg'));
  row.append(toggle);
  const mobile = matchMedia('(max-width: 1080px)');
  let dismissed = false;
  const update = () => {
    const open = dropdown.classList.contains('open');
    toggle.setAttribute('aria-expanded', String(open));
    menu.inert = mobile.matches && !open;
  };
  toggle.addEventListener('click', () => { dropdown.classList.toggle('open'); update(); });
  dropdown.addEventListener('pointerenter', () => {
    if (mobile.matches) return;
    dismissed = false;
    dropdown.classList.add('open');
    update();
  });
  dropdown.addEventListener('pointerleave', () => {
    if (mobile.matches || dropdown.contains(document.activeElement)) return;
    dropdown.classList.remove('open');
    update();
  });
  dropdown.addEventListener('focusin', () => {
    if (mobile.matches || dismissed) return;
    dropdown.classList.add('open');
    update();
  });
  dropdown.addEventListener('focusout', () => {
    setTimeout(() => {
      if (dropdown.contains(document.activeElement)) return;
      dismissed = false;
      if (!dropdown.matches(':hover')) dropdown.classList.remove('open');
      update();
    }, 0);
  });
  dropdown.addEventListener('keydown', event => {
    if (event.key === 'Escape' && dropdown.classList.contains('open')) {
      event.stopPropagation();
      event.preventDefault();
      dropdown.classList.remove('open');
      dismissed = true;
      update();
      toggle.focus();
    }
  });
  menu.addEventListener('click', event => {
    if (event.target.closest('a')) { dropdown.classList.remove('open'); update(); }
  });
  mobile.addEventListener('change', update);
  update();
});
