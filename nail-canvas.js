(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', () => {
    const D = window.NailDesign;
    const $ = id => document.getElementById(id);
    if (!D || !$('canvasWorkspace')) return;
    const storageKey = 'tnm.nail-canvas.v1';
    let design = D.fromLook(), selected = 3, selectedDetail = 0, artColor = 'Gold';
    let undo = [], redo = [], storageAvailable = true, drag = null, sliderBefore = null;
    const historyLimit = 40;
    const readDesign = text => {
      try { return text && text.length <= 12000 ? D.validate(JSON.parse(text)) : null; } catch { return null; }
    };
    // Query data is validated before it can become part of the renderer or booking.
    const incoming = readDesign(new URLSearchParams(location.search).get('design'));
    try { design = incoming || readDesign(localStorage.getItem(storageKey)) || design; }
    catch { storageAvailable = false; design = incoming || design; }
    function button(label, value, action, className = '') {
      const node = document.createElement('button');
      node.type = 'button'; node.textContent = label; node.className = className;
      node.dataset.value = value; node.addEventListener('click', action); return node;
    }
    function announce(message) { $('canvasStatus').textContent = message; }
    function save() {
      try { localStorage.setItem(storageKey, JSON.stringify(design)); storageAvailable = true; }
      catch { storageAvailable = false; }
      $('saveState').textContent = storageAvailable ? 'Saved on this device' : 'Kept in this tab';
    }
    function remember(before) {
      if (JSON.stringify(before) === JSON.stringify(design)) return;
      undo.push(before); if (undo.length > historyLimit) undo.shift(); redo = [];
      save();
    }
    function change(action, message) {
      const before = D.clone(design); action(); remember(before); render();
      if (message) announce(message);
    }
    function renderPreview() { $('handPreview').innerHTML = D.handSVG(design, selected, 'canvas', true); }
    function syncHandoff() {
      const nail = design.nails[selected];
      $('designId').textContent = D.id(design);
      $('designSummary').textContent = `${D.names[selected]}: ${nail.length.toLowerCase()} ${nail.shape.toLowerCase()} · ${nail.color} · ${nail.finish.toLowerCase()}${nail.art.length ? ` · ${nail.art.length} art detail${nail.art.length > 1 ? 's' : ''}` : ''}`;
      $('bookDesign').href = 'booking.html#design=' + encodeURIComponent(JSON.stringify(design));
      $('undoDesign').disabled = !undo.length; $('redoDesign').disabled = !redo.length;
    }
    function syncSliders() {
      const art = design.nails[selected].art;
      selectedDetail = Math.max(0, Math.min(selectedDetail, art.length - 1));
      $('detailEditor').hidden = !art.length;
      const chosen = art[selectedDetail];
      if (chosen) {
        $('artX').value = Math.round(chosen.x); $('artY').value = Math.round(chosen.y);
        $('artSize').value = Math.round(chosen.size * 100); $('artRotation').value = Math.round(chosen.rotation);
      }
      $('detailList').replaceChildren(...art.map((item, index) => {
        const node = button(`${index + 1}. ${item.type}`, index, () => { selectedDetail = index; artColor = item.color; renderControls(); });
        node.setAttribute('aria-pressed', String(index === selectedDetail)); return node;
      }));
    }
    function pressed(group, value) {
      $(group).querySelectorAll('button').forEach(node => node.setAttribute('aria-pressed', String(node.dataset.value === String(value))));
    }
    function renderControls() {
      const nail = design.nails[selected];
      $('selectedNail').textContent = D.names[selected] + ' nail';
      pressed('fingerButtons', selected); pressed('shapeOptions', nail.shape); pressed('lengthOptions', nail.length);
      pressed('colorOptions', nail.color); pressed('finishOptions', nail.finish); pressed('artColorOptions', artColor);
      $('colorName').textContent = nail.color; $('skinTone').value = design.skin;
      $('artOptions').querySelectorAll('button').forEach(node => { node.disabled = nail.art.length >= 3; });
      syncSliders(); syncHandoff();
    }
    function render() { renderPreview(); renderControls(); }
    function selectNail(index) {
      selected = index; selectedDetail = 0;
      const art = design.nails[selected].art[0]; if (art) artColor = art.color;
      render(); announce(D.names[selected] + ' selected. Base choices affect ' + ($('editAll').checked ? 'all five nails.' : 'this nail.'));
    }
    const baseGroup = (id, values, property) => {
      $(id).replaceChildren(...values.map(value => {
        const node = button(value, value, () => change(() => {
          ($('editAll').checked ? design.nails : [design.nails[selected]]).forEach(nail => { nail[property] = value; });
        }, value + ' applied to ' + ($('editAll').checked ? 'all nails.' : D.names[selected].toLowerCase() + '.')));
        node.setAttribute('aria-pressed', 'false'); return node;
      }));
    };
    baseGroup('shapeOptions', D.shapes, 'shape'); baseGroup('lengthOptions', D.lengths, 'length');
    baseGroup('finishOptions', D.finishes, 'finish'); baseGroup('colorOptions', Object.keys(D.colors), 'color');
    $('colorOptions').querySelectorAll('button').forEach(node => {
      node.className = 'nc-swatch'; node.setAttribute('aria-label', node.dataset.value); node.title = node.dataset.value;
      node.style.setProperty('--swatch', D.colors[node.dataset.value]);
      const swatch = document.createElement('span'); swatch.setAttribute('aria-hidden', 'true'); node.replaceChildren(swatch);
    });
    $('fingerButtons').replaceChildren(...D.names.map((name, i) => button(name, i, () => selectNail(i))));
    $('artColorOptions').replaceChildren(...Object.keys(D.artColors).map(value => button(value, value, () => {
      artColor = value;
      if (design.nails[selected].art[selectedDetail]) change(() => { design.nails[selected].art[selectedDetail].color = value; }, value + ' applied to the selected detail.');
      else renderControls();
    })));
    const symbols = { Star: '✧', Heart: '♡', Flower: '✿', Bow: '୨୧', Pearl: '◉', Wave: '∿', Moon: '☾' };
    $('artOptions').replaceChildren(...D.arts.map(type => {
      const node = button(type, type, () => {
        if (design.nails[selected].art.length >= 3) return;
        change(() => {
          const details = design.nails[selected].art;
          details.push({ type, color: artColor, x: 50, y: 55 + details.length * 28, size: .85, rotation: 0 });
          selectedDetail = details.length - 1;
        }, type + ' added. Drag it on the nail or use the position sliders.');
      });
      const icon = document.createElement('span'); icon.setAttribute('aria-hidden', 'true'); icon.textContent = symbols[type]; node.prepend(icon);
      node.setAttribute('aria-label', 'Add ' + type.toLowerCase()); return node;
    }));
    $('skinTone').addEventListener('change', event => change(() => { design.skin = event.target.value; }));
    $('copyNail').addEventListener('click', () => change(() => {
      const nail = D.clone(design.nails[selected]); design.nails = D.names.map(() => D.clone(nail));
    }, 'Copied this nail, including artwork, to all five fingers.'));
    $('resetDesign').addEventListener('click', () => change(() => { design = D.fromLook(); selected = 3; selectedDetail = 0; }, 'Set reset. Use Undo to restore your previous design.'));
    $('removeDetail').addEventListener('click', () => change(() => { design.nails[selected].art.splice(selectedDetail, 1); }, 'Selected detail removed.'));
    $('undoDesign').addEventListener('click', () => {
      if (!undo.length) return; redo.push(D.clone(design)); design = undo.pop(); save(); render(); announce('Last change undone.');
    });
    $('redoDesign').addEventListener('click', () => {
      if (!redo.length) return; undo.push(D.clone(design)); design = redo.pop(); save(); render(); announce('Change restored.');
    });
    const stage = $('nailStage');
    stage.addEventListener('click', event => {
      const nail = event.target.closest('[data-nail]');
      if (nail && !event.target.closest('[data-detail]')) selectNail(Number(nail.dataset.nail));
    });
    stage.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      const detail = event.target.closest('[data-detail]'); if (!detail) return;
      const surface = detail.closest('[data-nail-surface]');
      const inverse = surface.getScreenCTM()?.inverse(); if (!inverse) return;
      const index = Number(surface.dataset.nailSurface);
      selected = index; selectedDetail = Number(detail.dataset.detail);
      const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(inverse);
      const item = design.nails[selected].art[selectedDetail]; artColor = item.color;
      drag = { pointerId: event.pointerId, before: D.clone(design), inverse, dx: item.x - point.x, dy: item.y - point.y };
      stage.setPointerCapture(event.pointerId); event.preventDefault(); renderControls();
    });
    stage.addEventListener('pointermove', event => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(drag.inverse);
      const item = design.nails[selected].art[selectedDetail];
      item.x = D.clamp(point.x + drag.dx, 18, 82, 50); item.y = D.clamp(point.y + drag.dy, 35, 130, 75);
      renderPreview(); $('artX').value = Math.round(item.x); $('artY').value = Math.round(item.y);
    });
    function endDrag(event) {
      if (!drag || drag.pointerId !== event.pointerId) return;
      const before = drag.before; drag = null;
      if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
      remember(before); render(); announce('Detail position updated.');
    }
    stage.addEventListener('pointerup', endDrag); stage.addEventListener('pointercancel', endDrag);
    stage.addEventListener('lostpointercapture', event => { if (drag) endDrag(event); });
    const sliders = { artX: ['x', 1], artY: ['y', 1], artSize: ['size', 100], artRotation: ['rotation', 1] };
    Object.entries(sliders).forEach(([id, [key, divisor]]) => {
      $(id).addEventListener('input', event => {
        const item = design.nails[selected].art[selectedDetail]; if (!item) return;
        if (!sliderBefore) sliderBefore = D.clone(design);
        item[key] = Number(event.target.value) / divisor; renderPreview(); syncHandoff();
      });
      const commit = () => { if (sliderBefore) { remember(sliderBefore); sliderBefore = null; renderControls(); } };
      $(id).addEventListener('change', commit); $(id).addEventListener('blur', commit);
    });
    function applyLook(next, label) {
      change(() => { next.skin = design.skin; design = next; selected = 3; selectedDetail = 0; artColor = next.nails[3].art[0]?.color || 'Gold'; }, label + ' loaded. Make it your own.');
      $('nail-canvas').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
      $('selectedNail').setAttribute('tabindex', '-1'); $('selectedNail').focus({ preventScroll: true });
    }
    // The illustrated mood board is real design data, not a disconnected mockup.
    $('lookCards').replaceChildren(...D.looks.map((look, i) => {
      const card = document.createElement('article'); card.className = 'nm-look'; card.dataset.mood = look.mood;
      const visual = button('', look.id, () => applyLook(D.fromLook(look), look.name), 'nm-look-visual');
      visual.setAttribute('aria-label', 'Customise ' + look.name);
      visual.innerHTML = `<span class="nm-look-number">THE EDIT / 0${i + 1}</span>${D.miniature(D.fromLook(look), 'look-' + i)}<span class="nm-look-arrow" aria-hidden="true">↗</span>`;
      const meta = document.createElement('div'); meta.className = 'nm-look-meta';
      const title = document.createElement('h3'); title.textContent = look.name;
      const mood = document.createElement('span'); mood.textContent = look.mood; meta.append(title, mood);
      const desc = document.createElement('p'); desc.textContent = look.desc; card.append(visual, meta, desc); return card;
    }));
    document.querySelectorAll('[data-filter]').forEach(node => node.addEventListener('click', () => {
      document.querySelectorAll('[data-filter]').forEach(other => other.setAttribute('aria-pressed', String(other === node)));
      document.querySelectorAll('.nm-look').forEach(card => { card.hidden = node.dataset.filter !== 'All' && card.dataset.mood !== node.dataset.filter; });
    }));
    // Native dialog provides focus containment and Escape support on current browsers.
    const dialog = $('matchDialog'); let matchOpener = null;
    const lock = () => document.body.classList.toggle('modal-open', !!document.querySelector('dialog[open]'));
    function closeMatch() { dialog.close(); }
    document.querySelectorAll('[data-open-match]').forEach(node => node.addEventListener('click', () => {
      if (typeof dialog.showModal !== 'function') { $('find-your-look').scrollIntoView(); return; }
      matchOpener = node; $('matchForm').hidden = false; $('matchResult').hidden = true;
      $('matchTitle').innerHTML = 'What’s your <em>mood?</em>'; dialog.showModal(); lock();
    }));
    $('closeMatch').addEventListener('click', closeMatch);
    dialog.addEventListener('close', () => { lock(); matchOpener?.focus(); });
    dialog.addEventListener('click', event => {
      const bounds = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) closeMatch();
    });
    $('matchForm').addEventListener('submit', event => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const mood = form.get('mood'), finish = form.get('finish'), length = form.get('length');
      const choices = D.looks.filter(look => look.mood === mood);
      const look = choices.find(item => item.finish === finish) || choices[0];
      const next = D.fromLook(look); next.nails.forEach(nail => { nail.length = length; nail.finish = finish; });
      $('matchForm').hidden = true; $('matchResult').hidden = false;
      $('matchTitle').innerHTML = 'A little <em>you.</em>';
      $('matchResult').innerHTML = `<div class="nm-match-result-visual">${D.miniature(next, 'match')}</div><div class="nm-match-result-copy"><h3>${look.name}</h3><p>${length} ${look.shape.toLowerCase()} nails, ${look.color.toLowerCase()} tones and a ${finish.toLowerCase()} finish.<br>A starting point. You get the final say.</p></div>`;
      const use = button('Make this look mine ↗', '', () => { closeMatch(); applyLook(next, look.name); }, 'nm-button');
      const retry = button('Try another mood', '', () => { $('matchForm').hidden = false; $('matchResult').hidden = true; $('matchTitle').innerHTML = 'What’s your <em>mood?</em>'; $('matchForm').querySelector('input').focus(); }, 'nm-text-link');
      $('matchResult').append(use, retry); use.focus();
    });
    $('downloadDesign').addEventListener('click', async () => {
      const trigger = $('downloadDesign'); trigger.disabled = true; announce('Preparing your design image…');
      try {
        // SVG is generated exclusively from the allowlisted model. No user HTML is inserted.
        const snapshot = D.clone(design), designId = D.id(snapshot);
        const hand = D.handSVG(snapshot, -1, 'export').replace('<svg ', '<svg x="225" y="130" width="750" height="975" ');
        const lines = snapshot.nails.map((n, i) => `${D.names[i]}: ${n.length} ${n.shape} / ${n.color} / ${n.finish}${n.art.length ? ' / ' + n.art.map(a => a.type).join(', ') : ''}`);
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500"><rect width="1200" height="1500" fill="#f8f3ef"/><text x="70" y="85" fill="#651e35" font-family="Georgia,serif" font-size="44">The Nail Masters / Nail Canvas</text><text x="70" y="125" fill="#776267" font-family="sans-serif" font-size="18">${designId} · A design to discuss with your artist</text><ellipse cx="600" cy="640" rx="440" ry="450" fill="#e6d1d5"/>${hand}<g fill="#651e35" font-family="sans-serif" font-size="22">${lines.map((text, i) => `<text x="70" y="${1160 + i * 42}">${text}</text>`).join('')}<text x="70" y="1410" font-size="18">Illustrated reference. Final design and price confirmed by the studio.</text><text x="70" y="1445" font-size="18">Sector 67, Mohali / +91 76968 84103</text></g></svg>`;
        const picture = new Image();
        await new Promise((resolve, reject) => { picture.onload = resolve; picture.onerror = reject; picture.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
        const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 1500;
        const context = canvas.getContext('2d'); if (!context) throw new Error('Canvas unavailable'); context.drawImage(picture, 0, 0);
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png')); if (!blob) throw new Error('Image export unavailable');
        const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'The-Nail-Masters-' + designId + '.png';
        document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
        announce('Preview downloaded. You can attach this image in your WhatsApp conversation.');
      } catch { announce('Image download is unavailable in this browser. Your design choices will still carry through to the enquiry.'); }
      finally { trigger.disabled = false; }
    });
    $('canvasWorkspace').hidden = false; $('canvasFallback').hidden = true; save(); render();
    // Reveal and hide workspaces before ScrollTrigger measures the retained sections.
    window.ScrollTrigger?.refresh();
  });
})();
