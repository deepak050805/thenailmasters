/* Shared, dependency-free design model and vector renderer. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NailDesign = api;
})(typeof window === 'object' ? window : globalThis, function () {
  'use strict';
  const names = ['Thumb', 'Index', 'Middle', 'Ring', 'Little'];
  const colors = { Nude: '#c68e79', Blush: '#d594a4', Cherry: '#8f1c35', Espresso: '#53372f', Sage: '#879781', Ink: '#242b2a', Pearl: '#e9e0cf', Gold: '#ba9157' };
  const artColors = { Gold: '#c69b52', Pearl: '#fff7e9', Wine: '#8f1c35', Ink: '#242b2a' };
  const shapes = ['Almond', 'Round', 'Square', 'Coffin'];
  const lengths = ['Short', 'Medium', 'Long'];
  const finishes = ['Glossy', 'Matte', 'Chrome'];
  const arts = ['Star', 'Heart', 'Flower', 'Bow', 'Pearl', 'Wave', 'Moon'];
  const skins = { Light: '#e8bda6', Warm: '#c68e70', Deep: '#85573f' };
  const looks = [
    { id: 'quiet-luxury', name: 'Quiet luxury', mood: 'Minimal', desc: 'Milky tones. A little gold. Effortlessly you.', color: 'Nude', shape: 'Almond', finish: 'Glossy', art: 'Star', accent: 'Gold' },
    { id: 'petal-study', name: 'Petal study', mood: 'Romantic', desc: 'A blush base with a soft, floral flourish.', color: 'Blush', shape: 'Round', finish: 'Glossy', art: 'Flower', accent: 'Pearl' },
    { id: 'after-hours', name: 'After hours', mood: 'Bold', desc: 'Cherry lacquer and an unapologetic shine.', color: 'Cherry', shape: 'Coffin', finish: 'Glossy', art: 'Heart', accent: 'Gold' },
    { id: 'sage-state', name: 'Sage state', mood: 'Minimal', desc: 'A fresh green palette, softened to matte.', color: 'Sage', shape: 'Square', finish: 'Matte', art: 'Wave', accent: 'Pearl' },
    { id: 'pearl-poetry', name: 'Pearl poetry', mood: 'Romantic', desc: 'Luminous pearl with a tiny sculptural detail.', color: 'Pearl', shape: 'Almond', finish: 'Chrome', art: 'Pearl', accent: 'Gold' },
    { id: 'midnight-muse', name: 'Midnight muse', mood: 'Bold', desc: 'Inky chrome, lit with a golden crescent.', color: 'Ink', shape: 'Coffin', finish: 'Chrome', art: 'Moon', accent: 'Gold' }
  ];
  const clone = value => JSON.parse(JSON.stringify(value));
  const clamp = (n, min, max, fallback) => Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
  function fromLook(look = looks[0]) {
    return { version: 1, skin: 'Warm', nails: names.map((_, i) => ({ shape: look.shape, length: 'Medium', color: look.color, finish: look.finish, art: i === 3 ? [{ type: look.art, color: look.accent, x: 50, y: 75, size: 1, rotation: 0 }] : [] })) };
  }
  function validate(value) {
    if (!value || value.version !== 1 || !Array.isArray(value.nails) || value.nails.length !== 5) return null;
    const nails = [];
    for (const nail of value.nails) {
      if (!nail || !shapes.includes(nail.shape) || !lengths.includes(nail.length) || !Object.hasOwn(colors, nail.color) || !finishes.includes(nail.finish) || !Array.isArray(nail.art) || nail.art.length > 3) return null;
      const art = [];
      for (const detail of nail.art) {
        if (!detail || !arts.includes(detail.type) || !Object.hasOwn(artColors, detail.color)) return null;
        art.push({ type: detail.type, color: detail.color, x: clamp(detail.x, 18, 82, 50), y: clamp(detail.y, 35, 130, 75), size: clamp(detail.size, .5, 1.8, 1), rotation: clamp(detail.rotation, -180, 180, 0) });
      }
      nails.push({ shape: nail.shape, length: nail.length, color: nail.color, finish: nail.finish, art });
    }
    return { version: 1, skin: Object.hasOwn(skins, value.skin) ? value.skin : 'Warm', nails };
  }
  const paths = {
    Almond: 'M50 8 C65 16 91 56 91 104 L90 128 Q88 157 50 158 Q12 157 10 128 L9 104 C9 56 35 16 50 8Z',
    Round: 'M10 65 C10 5 90 5 90 65 L90 128 Q88 158 50 158 Q12 158 10 128Z',
    Square: 'M13 19 Q50 11 87 19 L91 129 Q88 158 50 158 Q12 158 9 129Z',
    Coffin: 'M29 12 Q50 8 71 12 L91 91 L90 129 Q88 158 50 158 Q12 158 10 129 L9 91Z'
  };
  function detailSVG(detail) {
    const drawings = {
      Star: '<path d="M0-17 4-4 15 0 4 4 0 17-4 4-15 0-4-4Z"/><circle cx="15" cy="-15" r="2"/>',
      Heart: '<path d="M0 13C-28-4-8-26 0-12 8-26 28-4 0 13Z"/>',
      Flower: '<ellipse cy="-10" rx="6" ry="9"/><ellipse cy="-10" rx="6" ry="9" transform="rotate(72)"/><ellipse cy="-10" rx="6" ry="9" transform="rotate(144)"/><ellipse cy="-10" rx="6" ry="9" transform="rotate(216)"/><ellipse cy="-10" rx="6" ry="9" transform="rotate(288)"/><circle r="4" fill="#c69b52"/>',
      Bow: '<g fill="none" stroke="currentColor" stroke-width="2.2"><path d="M0 0C-32-29-26 16 0 0 26 16 32-29 0 0M0 0-11 22M0 0 11 22"/></g><circle r="3"/>',
      Pearl: '<circle r="11" fill="#fff5df" stroke="#b49a72" stroke-width="1.2"/><circle cx="-3" cy="-4" r="4" fill="#fff"/>',
      Wave: '<path d="M-30-30C30-25-30 25 30 30" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>',
      Moon: '<path d="M7-17A18 18 0 1 0 12 15 19 19 0 0 1 7-17Z"/>'
    };
    return `<g transform="translate(${detail.x} ${detail.y}) rotate(${detail.rotation}) scale(${detail.size})" fill="${artColors[detail.color]}" color="${artColors[detail.color]}">${drawings[detail.type]}</g>`;
  }
  function nailSVG(nail, id, interactive = false) {
    const path = paths[nail.shape];
    const chrome = nail.finish === 'Chrome';
    const matte = nail.finish === 'Matte';
    return `<defs><clipPath id="clip-${id}"><path d="${path}"/></clipPath><linearGradient id="paint-${id}" x1="0" x2="1"><stop stop-color="${colors[nail.color]}"/><stop offset=".32" stop-color="${chrome ? '#fbf5e6' : colors[nail.color]}"/><stop offset=".5" stop-color="${colors[nail.color]}"/><stop offset=".75" stop-color="${chrome ? '#faf0df' : colors[nail.color]}"/><stop offset="1" stop-color="${colors[nail.color]}"/></linearGradient><linearGradient id="shade-${id}" x1="0" x2="1"><stop stop-color="#000" stop-opacity=".2"/><stop offset=".4" stop-color="#fff" stop-opacity=".08"/><stop offset=".8" stop-color="#fff" stop-opacity=".1"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient></defs><path d="${path}" fill="url(#paint-${id})"/><path d="${path}" fill="url(#shade-${id})" stroke="#442d29" stroke-opacity=".17" stroke-width="1.5"/><g clip-path="url(#clip-${id})">${matte ? '' : '<path d="M31 43Q19 76 25 117" fill="none" stroke="#fff" stroke-opacity=".46" stroke-width="5" stroke-linecap="round"/><path d="M75 68 76 112" stroke="#fff" stroke-opacity=".16" stroke-width="2"/>'}${nail.art.map((detail, index) => `<g ${interactive ? `data-detail="${index}" class="nc-art"` : ''}>${detailSVG(detail)}</g>`).join('')}</g>`;
  }
  function miniature(design, prefix = 'mini') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 330 225" aria-hidden="true"><g transform="translate(22 40) rotate(-13 50 90)">${nailSVG(design.nails[1], prefix + '-a')}</g><g transform="translate(116 8)">${nailSVG(design.nails[3], prefix + '-b')}</g><g transform="translate(215 40) rotate(13 50 90)">${nailSVG(design.nails[2], prefix + '-c')}</g></svg>`;
  }
  const positions = [
    { x: 86, y: 298, scale: .48, angle: -39 }, { x: 162, y: 139, scale: .49, angle: -3 },
    { x: 230, y: 76, scale: .51, angle: 0 }, { x: 302, y: 105, scale: .48, angle: 4 },
    { x: 367, y: 197, scale: .40, angle: 13 }
  ];
  function handSVG(design, selected = -1, prefix = 'hand', interactive = false) {
    const skin = skins[design.skin];
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 650" class="nc-hand" ${interactive ? 'aria-label="Interactive nail preview. Choose a finger using the buttons below." role="group"' : 'aria-hidden="true"'}><defs><linearGradient id="skin-${prefix}"><stop stop-color="${skin}"/><stop offset=".35" stop-color="${skin}"/><stop offset=".6" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="${skin}"/></linearGradient><radialGradient id="light-${prefix}" cx="38%" cy="25%" r="75%"><stop stop-color="#fff" stop-opacity=".25"/><stop offset="1" stop-color="#572e20" stop-opacity=".16"/></radialGradient><filter id="shadow-${prefix}" x="-40%" width="180%" y="-20%" height="150%"><feDropShadow dx="10" dy="18" stdDeviation="14" flood-color="#3d2820" flood-opacity=".15"/></filter></defs><g filter="url(#shadow-${prefix})"><path d="M181 660C160 567 169 507 135 458L69 361Q47 331 66 316Q86 299 107 321L169 393 164 178Q163 151 185 149Q208 147 211 177L226 309 230 115Q231 86 255 86Q281 86 282 116L287 295 304 142Q307 113 331 116Q355 121 351 151L344 328 369 220Q378 198 397 204Q415 211 409 235L386 420Q383 477 358 529L341 660Z" fill="${skin}"/><path d="M181 660C160 567 169 507 135 458L69 361Q47 331 66 316Q86 299 107 321L169 393 164 178Q163 151 185 149Q208 147 211 177L226 309 230 115Q231 86 255 86Q281 86 282 116L287 295 304 142Q307 113 331 116Q355 121 351 151L344 328 369 220Q378 198 397 204Q415 211 409 235L386 420Q383 477 358 529L341 660Z" fill="url(#light-${prefix})"/><g fill="none" stroke="#6d3f2d" stroke-opacity=".15" stroke-width="2" stroke-linecap="round"><path d="M177 269q15-7 29-2m-27 8q12-4 22-2M239 234q15-6 30-1m-26 7 24-1M308 258q14-3 27 2m-26 5 24 2M371 326q10-2 20 4M126 385q8-13 18-13M199 437q33-19 67-8M191 571q71-14 143 4"/></g><path d="M173 474Q227 412 250 385" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width="9" stroke-linecap="round"/><path d="M293 325 337 331 335 344 291 337Z" fill="#c49b56"/><path d="M297 326 334 331" stroke="#f7e7ba" stroke-width="2"/></g>${design.nails.map((nail, i) => {
      const p = positions[i];
      const length = { Short: .68, Medium: .87, Long: 1.08 }[nail.length];
      const offset = 158 * (1 - length);
      return `<g transform="translate(${p.x} ${p.y}) rotate(${p.angle} 25 75) scale(${p.scale})" ${interactive ? `data-nail="${i}" class="nc-nail"` : ''}><g transform="translate(0 ${offset}) scale(1 ${length})" data-nail-surface="${i}">${nailSVG(nail, prefix + i, interactive)}${selected === i ? `<path d="${paths[nail.shape]}" fill="none" stroke="#fff8e8" stroke-width="4" stroke-dasharray="7 5" pointer-events="none"/>` : ''}</g></g>`;
    }).join('')}</svg>`;
  }
  function id(design) {
    let hash = 2166136261;
    for (const c of JSON.stringify(validate(design))) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619);
    return 'NM-' + (hash >>> 0).toString(36).toUpperCase().padStart(7, '0');
  }
  function summary(design) {
    return ['Nail Canvas ' + id(design), ...design.nails.map((nail, i) => `${names[i]}: ${nail.length} ${nail.shape}, ${nail.color}, ${nail.finish}${nail.art.length ? '; ' + nail.art.map(a => `${a.color} ${a.type} (x${Math.round(a.x)}, y${Math.round(a.y)}, ${Math.round(a.size * 100)}%, ${Math.round(a.rotation)}deg)`).join(', ') : '; no art'}`), 'Illustrated reference only. Please confirm suitability, price and appointment availability.'].join('\n');
  }
  return { names, colors, artColors, shapes, lengths, finishes, arts, skins, looks, clone, clamp, fromLook, validate, nailSVG, miniature, handSVG, id, summary };
});
