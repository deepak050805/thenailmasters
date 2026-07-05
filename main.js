/* ==============================================================
   THE NAIL MASTERS — main.js
   Preloader, custom cursor, Lenis smooth scroll, GSAP reveals,
   AOS init, gallery (masonry/filter/lightbox), testimonials
   swiper, FAQ accordion, booking form, nav + micro-interactions.
   ============================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------------- Preloader ---------------- */
  const preMark = document.getElementById('preMark');
  const brandLetters = 'The Nail Masters'.split('');
  brandLetters.forEach((ch, i) => {
    const span = document.createElement('span');
    span.textContent = ch === ' ' ? '\u00A0' : ch;
    span.style.animationDelay = `${i * 0.035}s`;
    preMark.appendChild(span);
  });

  window.addEventListener('load', () => {
    setTimeout(() => {
      document.getElementById('preloader').classList.add('hide');
      document.body.style.overflow = '';
    }, 1400);
  });

  /* ---------------- Custom cursor ---------------- */
  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  let mx = 0, my = 0, rx = 0, ry = 0;
  window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; dot.style.left = mx + 'px'; dot.style.top = my + 'px'; });
  (function loopCursor(){
    rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
    ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
    requestAnimationFrame(loopCursor);
  })();
  document.querySelectorAll('a, button, .filter-btn, .masonry-item, input, textarea, select').forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('grow'));
    el.addEventListener('mouseleave', () => ring.classList.remove('grow'));
  });

  /* ---------------- Lenis smooth scroll ---------------- */
  let lenis;
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    function raf(time){ lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    if (window.gsap && window.ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }

  /* ---------------- AOS ---------------- */
  if (window.AOS) AOS.init({ duration: 800, easing: 'ease-out-cubic', once: true, offset: 60 });

  /* ---------------- Header scroll state ---------------- */
  const header = document.getElementById('siteHeader');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  });

  /* ---------------- Mobile nav ---------------- */
  const burger = document.getElementById('burger');
  const navLinks = document.getElementById('navLinks');
  burger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    burger.classList.toggle('active');
  });
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

  /* ---------------- Brush-stroke draw on view (signature element) ---------------- */
  const brushes = document.querySelectorAll('.brush');
  const brushObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('in-view'); });
  }, { threshold: 0.4 });
  brushes.forEach(b => brushObserver.observe(b));

  /* ---------------- Magnetic buttons ---------------- */
  document.querySelectorAll('[data-magnetic]').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      btn.style.transform = `translate(${x * 0.25}px, ${y * 0.4}px)`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = 'translate(0,0)'; });
  });

  /* ---------------- Button ripple ---------------- */
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function(e){
      const r = document.createElement('span');
      r.className = 'ripple';
      const rect = this.getBoundingClientRect();
      r.style.left = (e.clientX - rect.left) + 'px';
      r.style.top = (e.clientY - rect.top) + 'px';
      this.appendChild(r);
      setTimeout(() => r.remove(), 650);
    });
  });

  /* ---------------- GSAP section reveals ---------------- */
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.utils.toArray('.service-card, .price-card, .offer-card').forEach((el, i) => {
      gsap.fromTo(el, { y: 40, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%' },
        delay: (i % 3) * 0.08
      });
    });
  }

  /* ---------------- Gallery: data-driven masonry ---------------- */
  const galleryData = [
    { cat: 'nail-art', tag: 'Nail Art', img: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=500', h: 620 },
    { cat: 'gel', tag: 'Gel Nails', img: 'https://i.pinimg.com/1200x/a7/a3/53/a7a3534a11881a252b1b97ef2abcf0ff.jpg', h: 420 },
    { cat: 'french', tag: 'French Tips', img: 'https://i.pinimg.com/736x/1d/56/05/1d5605b105b5dc0b9fcc4f16a9e265c5.jpg', h: 520 },
    { cat: 'bridal', tag: 'Bridal Nails', img: 'https://i.pinimg.com/736x/0e/85/98/0e8598e01ec277bdee6ec303720dce9f.jpg', h: 700 },
    { cat: 'chrome', tag: 'Chrome Nails', img: 'https://i.pinimg.com/1200x/99/56/8b/99568bce9c9191261c156b3a08f767d8.jpg', h: 460 },
    { cat: 'cateye', tag: 'Cat Eye', img: 'https://i.pinimg.com/736x/7a/f9/ea/7af9ea13ed2fcd84441e44e1d2a7c46f.jpg', h: 560 },
    { cat: 'pastel', tag: 'Pastel', img: 'https://i.pinimg.com/736x/a3/21/83/a32183e4ea2b8d2e1e7905bfe10107f5.jpg', h: 480 },
    { cat: 'facial', tag: 'Hydra Facial', img: 'https://i.pinimg.com/736x/20/68/c7/2068c767f1466a806e9222b81a614e78.jpg', h: 640 },
    { cat: 'salon', tag: 'Salon', img: 'https://i.pinimg.com/1200x/12/05/da/1205da2d133c987819991bcd32c81281.jpg', h: 500 },
    { cat: 'nail-art', tag: 'Nail Art', img: 'https://i.pinimg.com/1200x/9c/f8/f5/9cf8f5167623d56ecb8ec3baa3032679.jpg', h: 540 },
    { cat: 'gel', tag: 'Gel Nails', img: 'https://i.pinimg.com/736x/3d/5b/b4/3d5bb44f057f493d05b4beb0a665aa6f.jpg', h: 600 },
    { cat: 'bridal', tag: 'Bridal Nails', img: 'https://i.pinimg.com/736x/12/8f/cb/128fcbc81e4f20d4b17080f1061360d8.jpg', h: 460 },
  ];

  const masonry = document.getElementById('masonry');
  galleryData.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'masonry-item';
    div.dataset.cat = item.cat;
    div.dataset.index = i;
    div.innerHTML = `<img src="${item.img}" alt="${item.tag} — The Nail Masters, Mohali" loading="lazy"><span class="tag">${item.tag}</span>`;
    masonry.appendChild(div);
  });

  /* Filtering */
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      document.querySelectorAll('.masonry-item').forEach(item => {
        item.classList.toggle('hidden', f !== 'all' && item.dataset.cat !== f);
      });
    });
  });

  /* Lightbox */
  const lightbox = document.getElementById('lightbox');
  const lbImg = lightbox.querySelector('img');
  let currentIndex = 0;
  function visibleItems(){ return Array.from(document.querySelectorAll('.masonry-item:not(.hidden)')); }
  function openLightbox(index){
    const items = visibleItems();
    currentIndex = items.findIndex(el => Number(el.dataset.index) === index);
    if (currentIndex === -1) currentIndex = 0;
    updateLightbox(items);
    lightbox.classList.add('open');
  }
  function updateLightbox(items){
    const item = items[currentIndex];
    lbImg.src = item.querySelector('img').src.replace('w=500','w=1400');
    lbImg.alt = item.querySelector('img').alt;
  }
  document.querySelectorAll('.masonry-item').forEach(item => {
    item.addEventListener('click', () => openLightbox(Number(item.dataset.index)));
  });
  lightbox.querySelector('.lb-close').addEventListener('click', () => lightbox.classList.remove('open'));
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.classList.remove('open'); });
  lightbox.querySelector('.lb-prev').addEventListener('click', () => {
    const items = visibleItems(); currentIndex = (currentIndex - 1 + items.length) % items.length; updateLightbox(items);
  });
  lightbox.querySelector('.lb-next').addEventListener('click', () => {
    const items = visibleItems(); currentIndex = (currentIndex + 1) % items.length; updateLightbox(items);
  });
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') lightbox.classList.remove('open');
    if (e.key === 'ArrowRight') lightbox.querySelector('.lb-next').click();
    if (e.key === 'ArrowLeft') lightbox.querySelector('.lb-prev').click();
  });

  /* ---------------- Swiper testimonials ---------------- */
  if (window.Swiper) {
    new Swiper('.testiSwiper', {
      slidesPerView: 1,
      spaceBetween: 24,
      loop: true,
      autoplay: { delay: 4500, disableOnInteraction: false },
      breakpoints: {
        720: { slidesPerView: 2 },
        1080: { slidesPerView: 3 }
      }
    });
  }

  /* ---------------- FAQ accordion ---------------- */
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    if (item.classList.contains('open')) a.style.maxHeight = a.scrollHeight + 'px';
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => { i.classList.remove('open'); i.querySelector('.faq-a').style.maxHeight = null; });
      if (!isOpen) { item.classList.add('open'); a.style.maxHeight = a.scrollHeight + 'px'; }
    });
  });

  /* ---------------- Booking form ---------------- */
  const form = document.getElementById('bookingForm');
  const status = document.getElementById('formStatus');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = data.get('name'), phone = data.get('phone'), service = data.get('service'),
          date = data.get('date'), time = data.get('time'), notes = data.get('notes');

    // This is a static site: we hand off to WhatsApp with a pre-filled message.
    // (The full-stack version stores this in MongoDB + emails the admin instead.)
    const msg = `Hi! I'd like to book an appointment.%0A` +
      `Name: ${name}%0APhone: ${phone}%0AService: ${service}%0ADate: ${date}%0ATime: ${time}` +
      (notes ? `%0ANotes: ${notes}` : '');
    status.textContent = 'Opening WhatsApp to confirm your request…';
    setTimeout(() => {
      window.open(`https://wa.me/917696884103?text=${msg}`, '_blank');
      form.reset();
      status.textContent = 'Request sent! We\'ll confirm your slot shortly.';
    }, 500);
  });

  /* ---------------- Smooth in-page anchor scrolling with Lenis ---------------- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length > 1 && document.querySelector(id)) {
        e.preventDefault();
        const target = document.querySelector(id);
        if (lenis) lenis.scrollTo(target, { offset: -80 });
        else target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

});