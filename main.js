document.addEventListener('DOMContentLoaded', () => {
  'use strict';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 1080px)');
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  };
  const iconButton = (label, symbol) => {
    const button = element('button', 'round-control', symbol);
    button.type = 'button';
    button.setAttribute('aria-label', label);
    button.title = label;
    return button;
  };
  const lockScroll = () => document.body.classList.toggle('modal-open', !!document.querySelector('dialog[open]'));
  const createDialog = (label, className) => {
    const dialog = element('dialog', className);
    dialog.setAttribute('aria-label', label);
    const close = iconButton('Close', '\u00d7');
    close.classList.add('dialog-close');
    dialog.append(close);
    document.body.append(dialog);
    close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', lockScroll);
    dialog.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const focusable = [...dialog.querySelectorAll('a[href], button, input, select, textarea, [tabindex="0"]')]
        .filter(node => !node.disabled && !node.closest('[inert]') && node.getClientRects().length);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if ((event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus();
      }
    });
    dialog.addEventListener('click', event => {
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right ||
          event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
    });
    return dialog;
  };
  const showDialog = dialog => { dialog.showModal(); lockScroll(); };
  const header = document.getElementById('siteHeader');
  const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 30);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  const burger = document.getElementById('burger');
  const nav = document.getElementById('navLinks');
  if (burger && nav) {
    const originalParent = nav.parentElement;
    const originalNext = nav.nextSibling;
    const dialog = createDialog('Main navigation', 'nav-dialog');
    dialog.id = 'mobileNavigation';
    burger.setAttribute('aria-controls', dialog.id);
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
    nav.setAttribute('aria-label', 'Main navigation');
    const sync = () => {
      if (dialog.open) dialog.close();
      if (mobile.matches) dialog.append(nav);
      else originalParent.insertBefore(nav, originalNext);
    };
    sync();
    mobile.addEventListener('change', sync);
    burger.addEventListener('click', () => {
      nav.classList.add('open');
      burger.classList.add('active');
      burger.setAttribute('aria-expanded', 'true');
      showDialog(dialog);
    });
    dialog.addEventListener('close', () => {
      nav.classList.remove('open');
      burger.classList.remove('active');
      burger.setAttribute('aria-expanded', 'false');
      burger.focus({ preventScroll: true });
    });
    nav.addEventListener('click', event => {
      if (event.target.closest('a') && dialog.open) dialog.close();
    });
    nav.querySelectorAll('a').forEach(link => {
      const target = new URL(link.href);
      if (target.pathname === location.pathname && !target.hash) link.setAttribute('aria-current', 'page');
    });
  }

  document.querySelectorAll('.brush').forEach(brush => brush.classList.add('in-view'));
  document.querySelectorAll('.faq-item').forEach((item, index) => {
    const old = item.querySelector('.faq-q');
    const answer = item.querySelector('.faq-a');
    if (!old || !answer) return;
    const question = element('button', 'faq-q');
    question.type = 'button';
    while (old.firstChild) question.append(old.firstChild);
    old.replaceWith(question);
    answer.id = 'faq-answer-' + index;
    question.setAttribute('aria-controls', answer.id);
    const update = () => {
      const open = item.classList.contains('open');
      question.setAttribute('aria-expanded', String(open));
      answer.hidden = !open;
    };
    update();
    question.addEventListener('click', () => { item.classList.toggle('open'); update(); });
  });

  // Preserve the existing Instagram destinations alongside photo viewing.
  const gallery = document.querySelector('.insta-strip');
  if (gallery) {
    const photos = [];
    gallery.querySelectorAll('a').forEach((link, index) => {
      const image = link.querySelector('img');
      if (!image) return;
      const frame = element('figure', 'gallery-photo');
      const button = element('button', 'gallery-open');
      button.type = 'button';
      button.setAttribute('aria-label', 'Enlarge photo ' + (index + 1) + ': ' + image.alt);
      link.before(frame);
      button.append(image);
      link.textContent = 'Instagram \u2197';
      link.className = 'gallery-source';
      frame.append(button, link);
      photos.push({ button, image });
    });
    const dialog = createDialog('Photo gallery', 'gallery-dialog');
    const image = element('img', 'lightbox-image');
    const caption = element('p', 'gallery-caption');
    caption.setAttribute('aria-live', 'polite');
    const controls = element('div', 'gallery-controls');
    const prev = iconButton('Previous photo', '\u2190');
    const next = iconButton('Next photo', '\u2192');
    controls.append(prev, caption, next);
    dialog.append(image, controls);
    let current = 0;
    const update = step => {
      current = (current + step + photos.length) % photos.length;
      image.src = photos[current].image.src;
      image.alt = photos[current].image.alt;
      caption.textContent = (current + 1) + ' / ' + photos.length;
    };
    photos.forEach((photo, index) => photo.button.addEventListener('click', () => {
      current = index;
      update(0);
      showDialog(dialog);
    }));
    prev.addEventListener('click', () => update(-1));
    next.addEventListener('click', () => update(1));
    dialog.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        update(event.key === 'ArrowLeft' ? -1 : 1);
      }
    });
    let touchX;
    image.addEventListener('touchstart', event => { touchX = event.changedTouches[0].clientX; }, { passive: true });
    image.addEventListener('touchend', event => {
      const distance = event.changedTouches[0].clientX - touchX;
      if (Math.abs(distance) > 45) update(distance < 0 ? 1 : -1);
    }, { passive: true });
  }

  document.querySelectorAll('.testiSwiper').forEach(container => {
    container.setAttribute('aria-label', 'Google customer reviews');
    container.setAttribute('role', 'region');
    const slides = Array.from(container.querySelectorAll('.swiper-slide'));
    const dialog = createDialog('Customer review', 'review-dialog');
    const detail = element('div', 'review-detail');
    dialog.append(detail);
    slides.forEach(slide => {
      const card = slide.querySelector('.testi-card');
      const stars = card.querySelector('.testi-stars');
      stars.setAttribute('aria-label', '5 out of 5 stars');
      const avatar = card.querySelector('img');
      avatar.loading = 'lazy';
      avatar.decoding = 'async';
      avatar.alt = '';
      avatar.width = 48;
      avatar.height = 48;
      avatar.addEventListener('error', () => {
        const initials = card.querySelector('.testi-who b').textContent.split(' ').slice(0, 2).map(word => word[0]).join('');
        const replacement = element('span', 'review-initials', initials);
        replacement.setAttribute('aria-hidden', 'true');
        avatar.replaceWith(replacement);
      }, { once: true });
      const button = element('button', 'review-read', 'Read full review');
      button.type = 'button';
      button.addEventListener('click', () => {
        detail.replaceChildren();
        detail.append(element('div', 'testi-stars', stars.textContent),
          element('h2', '', card.querySelector('.testi-who b').textContent),
          element('blockquote', '', card.querySelector('p').textContent),
          element('p', 'review-source', card.querySelector('.testi-who div span').textContent));
        showDialog(dialog);
      });
      card.querySelector('p').after(button);
    });
    if (!window.Swiper) return;
    const controls = element('div', 'review-controls');
    const prev = iconButton('Previous review', '\u2190');
    const next = iconButton('Next review', '\u2192');
    const progress = element('span', 'review-progress');
    progress.setAttribute('aria-live', 'polite');
    controls.append(prev, progress, next);
    container.after(controls);
    const swiper = new Swiper(container, {
      slidesPerView: 1, spaceBetween: 20, speed: reducedMotion.matches ? 0 : 450,
      centeredSlides: true, grabCursor: true, watchSlidesProgress: true,
      keyboard: { enabled: false },
      a11y: { enabled: true, slideLabelMessage: 'Review {{index}} of {{slidesLength}}', nextSlideMessage: 'Next review', prevSlideMessage: 'Previous review' },
      navigation: { prevEl: prev, nextEl: next },
      breakpoints: { 720: { slidesPerView: 1.65 }, 1080: { slidesPerView: 2.3, spaceBetween: 28 } },
      on: {
        init() { progress.textContent = '1 / ' + slides.length; },
        slideChange() { progress.textContent = (this.activeIndex + 1) + ' / ' + slides.length; },
        progress() { this.slides.forEach(slide => { slide.inert = !slide.classList.contains('swiper-slide-visible'); }); }
      }
    });
    container.tabIndex = 0;
    container.addEventListener('keydown', event => {
      if (event.target !== container) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        if (event.key === 'ArrowRight') swiper.slideNext();
        else swiper.slidePrev();
      }
    });
    reducedMotion.addEventListener('change', event => { swiper.params.speed = event.matches ? 0 : 450; });
  });

  // This static site hands data to WhatsApp; customers still confirm and send there.
  const whatsapp = (status, lines) => {
    const url = new URL('https://wa.me/917696884103');
    url.searchParams.set('text', lines.join('\n'));
    window.open(url.href, '_blank', 'noopener,noreferrer');
    status.replaceChildren(document.createTextNode('Continue in WhatsApp to send your request. '));
    const link = element('a', 'link-arrow', 'Open WhatsApp');
    link.href = url.href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    status.append(link);
  };
  ['bookingForm', 'contactForm'].forEach(id => {
    const form = document.getElementById(id);
    if (!form) return;
    const status = document.getElementById(id === 'bookingForm' ? 'formStatus' : 'contactFormStatus');
    status.setAttribute('role', 'status');
    form.querySelectorAll('input, textarea').forEach(input => {
      if (input.name === 'name') { input.maxLength = 80; input.autocomplete = 'name'; input.minLength = 2; }
      if (input.type === 'tel') { input.maxLength = 24; input.pattern = '[+0-9\\s\\(\\)\\-]{7,24}'; input.autocomplete = 'tel'; }
      if (input.type === 'email') { input.maxLength = 254; input.autocomplete = 'email'; }
      if (input.tagName === 'TEXTAREA') input.maxLength = 2000;
      if (input.getAttribute('type') === 'date') {
        const today = new Date();
        input.min = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
        if (input.type !== 'date') {
          input.placeholder = 'YYYY-MM-DD';
          input.pattern = '[0-9]{4}-[0-9]{2}-[0-9]{2}';
          input.inputMode = 'numeric';
        }
      }
      if (input.getAttribute('type') === 'time' && input.type !== 'time') {
        input.placeholder = 'HH:MM';
        input.pattern = '([01][0-9]|2[0-3]):[0-5][0-9]';
        input.inputMode = 'numeric';
      }
      input.addEventListener('input', () => input.setCustomValidity(''));
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      const name = form.elements.name;
      name.setCustomValidity(name.value.trim().length < 2 ? 'Please enter your name.' : '');
      const phone = form.elements.phone;
      phone.setCustomValidity(phone.value.replace(/\D/g, '').length < 7 ? 'Please enter a valid phone number.' : '');
      const message = form.elements.message;
      if (message) message.setCustomValidity(message.value.trim() ? '' : 'Please enter your message.');
      const date = form.elements.date;
      if (date) {
        const parts = date.value.split('-').map(Number);
        const parsed = new Date(parts[0], parts[1] - 1, parts[2]);
        const valid = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date.value) && date.value >= date.min &&
          parsed.getFullYear() === parts[0] && parsed.getMonth() === parts[1] - 1 && parsed.getDate() === parts[2];
        date.setCustomValidity(valid ? '' : 'Please choose a valid date from today onwards.');
      }
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      const lines = [id === 'bookingForm' ? "Hi! I'd like to book an appointment." : 'Hi! I have a question.'];
      data.forEach((value, key) => { if (String(value).trim()) lines.push(key[0].toUpperCase() + key.slice(1) + ': ' + String(value).trim()); });
      whatsapp(status, lines);
    });
  });
  document.querySelectorAll('.footer-news form').forEach(form => {
    form.removeAttribute('onsubmit');
    const email = form.querySelector('input');
    email.setAttribute('aria-label', 'Email for studio updates');
    email.autocomplete = 'email';
    email.maxLength = 254;
    const status = element('p', 'form-status');
    status.setAttribute('role', 'status');
    form.after(status);
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (form.reportValidity()) whatsapp(status, ['Hi! Please share studio updates with me.', 'Email: ' + email.value.trim()]);
    });
  });
});
