/* Validated, local design handoff into the existing WhatsApp booking form. */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', () => {
    const D = window.NailDesign, form = document.getElementById('bookingForm');
    if (!D || !form || !location.hash.startsWith('#design=')) return;
    let design;
    try {
      const text = new URLSearchParams(location.hash.slice(1)).get('design');
      if (!text || text.length > 12000) return;
      design = D.validate(JSON.parse(text));
    } catch { return; }
    if (!design) return;
    const summary = D.summary(design);
    const notes = form.elements.notes;
    const originalNotes = notes.value;
    form.elements.service.value = 'Nail Services';
    // Existing notes are retained; the booking form already validates and URL-encodes them.
    notes.value = (summary + (originalNotes ? '\n\n' + originalNotes : '')).slice(0, 2000);
    const banner = document.createElement('div'); banner.className = 'nm-booking-design';
    const image = document.createElement('div'); image.innerHTML = D.miniature(design, 'booking');
    const copy = document.createElement('div');
    const heading = document.createElement('h3'); heading.textContent = 'Your canvas is coming with you.';
    const text = document.createElement('p'); text.textContent = D.id(design) + ' · Your choices are added to the enquiry notes. Save the preview from the canvas to share the exact artwork placement with your artist.';
    const edit = document.createElement('a'); edit.textContent = 'Edit design ↗'; edit.href = 'index.html?design=' + encodeURIComponent(JSON.stringify(design)) + '#nail-canvas';
    const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Remove from enquiry ×';
    remove.addEventListener('click', () => {
      // Preserve any additional notes typed after the design summary.
      if (notes.value.startsWith(summary)) notes.value = notes.value.slice(summary.length).replace(/^\s+/, '');
      banner.remove(); history.replaceState(null, '', location.pathname + location.search); notes.focus();
    });
    copy.append(heading, text, edit, remove); banner.append(image, copy); form.before(banner);
  });
})();
