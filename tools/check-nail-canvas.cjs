/* Run with Node; optional second argument is a temporary linkedom module path. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const D = require('../nail-design.js');
const root = path.resolve(__dirname, '..');
let assertions = 0;
const check = (condition, message) => { assert.ok(condition, message); assertions++; };
const initial = D.fromLook();
check(D.validate(initial), 'Initial design is valid');
check(D.validate({ ...initial, nails: initial.nails.slice(1) }) === null, 'Reject missing fingers');
check(D.validate({ ...initial, version: 2 }) === null, 'Reject unknown schema');
for (const field of ['shape', 'length', 'color', 'finish']) {
  const corrupt = D.clone(initial); corrupt.nails[0][field] = '<img src=x onerror=alert(1)>';
  check(D.validate(corrupt) === null, 'Reject untrusted ' + field);
}
const invalidArt = D.clone(initial); invalidArt.nails[0].art = [{ type: 'script', color: 'Gold' }];
check(D.validate(invalidArt) === null, 'Reject untrusted artwork');
const tooMuchArt = D.clone(initial); tooMuchArt.nails[0].art = Array(4).fill({ type: 'Star', color: 'Gold' });
check(D.validate(tooMuchArt) === null, 'Bound artwork count');
const prototypeColor = D.clone(initial); prototypeColor.nails[0].color = '__proto__';
check(D.validate(prototypeColor) === null, 'Reject prototype properties');
const clamped = D.clone(initial); clamped.nails[0].art = [{ type: 'Star', color: 'Gold', x: -Infinity, y: 9999, size: -2, rotation: 999 }];
assert.deepEqual(D.validate(clamped).nails[0].art[0], { type: 'Star', color: 'Gold', x: 50, y: 130, size: .5, rotation: 180 }); assertions++;
check(D.id(initial) === D.id(D.clone(initial)), 'Stable design identifiers');
const modified = D.clone(initial); modified.nails[0].color = 'Cherry';
check(D.id(initial) !== D.id(modified), 'Design identifiers reflect changes');
let variants = 0;
for (const shape of D.shapes) for (const length of D.lengths) for (const finish of D.finishes) for (const color of Object.keys(D.colors)) {
  const design = D.fromLook(); design.nails.forEach(n => Object.assign(n, { shape, length, finish, color }));
  const svg = D.handSVG(design, 0, 'test', true);
  check(!/NaN|undefined|Infinity|<script|onload=/.test(svg), 'Safe render for ' + [shape, length, finish, color].join('/'));
  const ids = [...svg.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  check(new Set(ids).size === ids.length, 'SVG IDs are unique');
  for (const [, reference] of svg.matchAll(/url\(#([^)]+)\)/g)) check(ids.includes(reference), 'SVG paint/clip reference resolves');
  check((svg.match(/data-nail="/g) || []).length === 5, 'All five fingers render');
  check(D.validate(design), 'Variant validates'); variants++;
}
const maximal = D.fromLook();
maximal.nails.forEach(n => { n.art = D.arts.slice(0, 3).map(type => ({ type, color: 'Pearl', x: 82, y: 130, size: 1.8, rotation: -180 })); });
const fragment = '#design=' + encodeURIComponent(JSON.stringify(maximal));
assert.deepEqual(D.validate(JSON.parse(new URLSearchParams(fragment.slice(1)).get('design'))), maximal); assertions++;
check(D.summary(maximal).length < 2000, 'Full five-finger design fits existing booking notes');
check(D.summary(maximal).includes('appointment availability'), 'Preview does not promise booking or pricing');
for (const look of D.looks) {
  const design = D.fromLook(look); check(D.validate(design), 'Curated look validates');
  for (const type of D.arts) {
    design.nails[0].art = [{ type, color: 'Gold', x: 50, y: 75, size: 1, rotation: 0 }];
    check(!D.handSVG(design).includes('undefined'), 'Art type renders: ' + type);
  }
}
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const ids = [...home.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
check(new Set(ids).size === ids.length, 'Homepage IDs unique');
const script = fs.readFileSync(path.join(root, 'nail-canvas.js'), 'utf8');
for (const [, id] of script.matchAll(/\$\('([^']+)'\)/g)) check(ids.includes(id), 'UI element exists: ' + id);
check(/prefers-reduced-motion/.test(fs.readFileSync(path.join(root, 'nail-canvas.css'), 'utf8')), 'Reduced motion supported');
console.log('Passed model/render/handoff checks: ' + assertions + ' assertions across ' + variants + ' design variants.');

if (!process.argv[2]) { console.log('DOM interaction suite optional: pass a linkedom module path as argument.'); process.exit(0); }
const { parseHTML } = require(path.resolve(process.argv[2]));
function fixture(html, js, options = {}) {
  const { window, document } = parseHTML(html);
  const captures = { images: [], downloads: [] };
  // These shims model browser primitives, not canvas application behavior.
  window.HTMLElement.prototype.focus = function () { document._focused = this; };
  window.HTMLElement.prototype.scrollIntoView = function () {};
  window.HTMLElement.prototype.setPointerCapture = function (id) { this._pointer = id; };
  window.HTMLElement.prototype.hasPointerCapture = function (id) { return this._pointer === id; };
  window.HTMLElement.prototype.releasePointerCapture = function () { this._pointer = null; };
  Object.defineProperty(window.HTMLAnchorElement.prototype, 'href', {
    configurable:true,
    get() { return new URL(this.getAttribute('href') || '', 'https://example.test/index.html').href; },
    set(value) { this.setAttribute('href', value); }
  });
  const create = document.createElement.bind(document);
  document.createElement = tag => {
    const node = create(tag);
    if (tag === 'dialog') {
      node.showModal = () => { node.open = true; node.setAttribute('open', ''); };
      node.close = () => { node.open = false; node.removeAttribute('open'); node.dispatchEvent(new window.Event('close')); };
    }
    if (tag === 'canvas') {
      node.getContext = () => ({ drawImage(image) { captures.images.push(image.src); } });
      node.toBlob = callback => callback(new Blob(['test-png'], { type: 'image/png' }));
    }
    if (tag === 'a') node.click = () => captures.downloads.push({ href: node.href, download: node.download });
    return node;
  };
  Object.defineProperty(window.HTMLSelectElement.prototype, 'value', {
    configurable: true,
    get() { return this._value || this.querySelector('[selected]')?.getAttribute('value') || this.querySelector('[selected]')?.textContent || ''; },
    set(value) { this._value = value; }
  });
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.showModal = () => { dialog.open = true; dialog.setAttribute('open', ''); };
    dialog.close = () => { dialog.open = false; dialog.removeAttribute('open'); dialog.dispatchEvent(new window.Event('close')); };
  });
  const stored = new Map();
  const storage = {
    getItem: key => { if (options.storageBlocked) throw Error('blocked'); return stored.get(key) || null; },
    setItem: (key, value) => { if (options.storageBlocked) throw Error('blocked'); stored.set(key, value); }
  };
  if (options.saved) stored.set('tnm.nail-canvas.v1', options.saved);
  const loc = { search: options.search || '', hash: options.hash || '', pathname: '/booking.html' };
  class Fields {
    constructor(form) { this.form = form; }
    get(name) { return this.form.querySelector(`input[name="${name}"][checked]`)?.value; }
  }
  window.NailDesign = D;
  class Point { constructor(x, y) { this.x = x; this.y = y; } matrixTransform() { return this; } }
  class Picture { set src(value) { this._src = value; queueMicrotask(() => this.onload()); } get src() { return this._src; } }
  vm.runInNewContext(js, { window, document, localStorage: storage, location: loc, URLSearchParams, URL, FormData: Fields, matchMedia: () => ({ matches: true, addEventListener() {} }), console, history: { replaceState() {} }, setTimeout: callback => { queueMicrotask(callback); }, DOMPoint: Point, Image: Picture });
  document.dispatchEvent(new window.Event('DOMContentLoaded'));
  const $ = id => document.getElementById(id);
  const click = node => { assert.ok(node, 'Click target exists'); node.dispatchEvent(new window.Event('click', { bubbles: true })); };
  const fire = (node, type) => node.dispatchEvent(new window.Event(type, { bubbles: true, cancelable: true }));
  const state = () => JSON.parse(stored.get('tnm.nail-canvas.v1'));
  return { window, document, $, click, fire, state, stored, captures };
}
const app = fixture(home, script);
const { $, click, fire, state } = app;
assert.equal($('canvasWorkspace').hidden, false);
assert.equal($('canvasFallback').hidden, true);
assert.equal($('lookCards').children.length, 6);
const pick = (group, value) => click($(group).querySelector(`[data-value="${value}"]`));
pick('fingerButtons', '0'); pick('shapeOptions', 'Square'); pick('colorOptions', 'Cherry');
assert.equal(state().nails[0].shape, 'Square'); assert.equal(state().nails[0].color, 'Cherry');
assert.equal(state().nails[1].color, 'Nude');
$('editAll').checked = true; pick('finishOptions', 'Matte');
assert.ok(state().nails.every(n => n.finish === 'Matte'));
pick('artOptions', 'Heart'); pick('artOptions', 'Moon'); pick('artOptions', 'Bow');
assert.equal(state().nails[0].art.length, 3);
assert.ok($('artOptions').querySelector('button').disabled);
$('artX').value = '72'; fire($('artX'), 'input'); fire($('artX'), 'change');
assert.equal(state().nails[0].art[2].x, 72);
$('artRotation').value = '45'; fire($('artRotation'), 'input'); fire($('artRotation'), 'change');
assert.equal(state().nails[0].art[2].rotation, 45);
pick('artColorOptions', 'Wine'); assert.equal(state().nails[0].art[2].color, 'Wine');
click($('removeDetail')); assert.equal(state().nails[0].art.length, 2);
click($('undoDesign')); assert.equal(state().nails[0].art.length, 3);
click($('redoDesign')); assert.equal(state().nails[0].art.length, 2);
click($('copyNail')); assert.ok(state().nails.every(n => JSON.stringify(n) === JSON.stringify(state().nails[0])));
const carried = D.validate(JSON.parse(new URLSearchParams($('bookDesign').getAttribute('href').split('#')[1]).get('design')));
assert.deepEqual(carried, state());
const beforeReset = state(); click($('resetDesign')); assert.deepEqual(state(), D.fromLook());
click($('undoDesign')); assert.deepEqual(state(), beforeReset);
click(app.document.querySelector('[data-filter="Romantic"]'));
assert.equal([...$('lookCards').children].filter(node => !node.hidden).length, 2);
click($('lookCards').children[1].querySelector('button'));
assert.equal(state().nails[0].color, 'Blush');
click(app.document.querySelector('[data-open-match]'));
assert.equal($('matchDialog').open, true);
fire($('matchForm'), 'submit'); assert.equal($('matchResult').hidden, false);
click($('matchResult').querySelector('.nm-button')); assert.equal($('matchDialog').open, false);
assert.equal(state().nails[0].color, 'Nude');
const surface = $('handPreview').querySelector('[data-nail-surface="3"]');
surface.getScreenCTM = () => ({ inverse() { return {}; } });
const pointer = (target, type, x, y) => {
  const event = new app.window.Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, { clientX: x, clientY: y, pointerId: 1, button: 0 }); target.dispatchEvent(event);
};
pointer(surface.querySelector('[data-detail="0"] path'), 'pointerdown', 50, 75);
pointer($('nailStage'), 'pointermove', 70, 105); pointer($('nailStage'), 'pointerup', 70, 105);
assert.equal(state().nails[3].art[0].x, 70); assert.equal(state().nails[3].art[0].y, 105);
const blocked = fixture(home, script, { storageBlocked: true });
assert.equal(blocked.$('canvasWorkspace').hidden, false);
assert.equal(blocked.$('saveState').textContent, 'Kept in this tab');
const bad = fixture(home, script, { saved: '{broken json' }); assert.deepEqual(bad.state(), D.fromLook());
const imported = fixture(home, script, { search: '?design=' + encodeURIComponent(JSON.stringify(maximal)) });
assert.deepEqual(imported.state(), maximal);

// Run the actual booking-prefill script against the retained booking markup.
const booking = fs.readFileSync(path.join(root, 'booking.html'), 'utf8');
// linkedom does not implement HTMLFormElement.elements; expose its standard name mapping.
const bookingSetup = `const f=document.getElementById('bookingForm');f.elements=Object.fromEntries([...f.querySelectorAll('[name]')].map(n=>[n.name||n.getAttribute('name'),n]));\n`;
const bookingScript = fs.readFileSync(path.join(root, 'nail-booking.js'), 'utf8');
const booked = fixture(booking, bookingSetup + bookingScript, { hash: fragment });
assert.equal(booked.$('service').value, 'Nail Services');
assert.equal(booked.$('notes').value, D.summary(maximal));
assert.ok(booked.document.querySelector('.nm-booking-design'));
booked.$('notes').value += '\nPersonal note';
booked.click(booked.document.querySelector('.nm-booking-design button'));
assert.equal(booked.$('notes').value, 'Personal note');
assert.equal(booked.document.querySelector('.nm-booking-design'), null);
const rejected = fixture(booking, bookingSetup + bookingScript, { hash: '#design=%7Bbroken' });
assert.equal(rejected.document.querySelector('.nm-booking-design'), null);
const integrated = fixture(home, script + '\n' + fs.readFileSync(path.join(root, 'main.js'), 'utf8'));
assert.equal(integrated.document.querySelectorAll('#gallery .gallery-photo').length, 6);
integrated.click(integrated.document.querySelector('#gallery .gallery-open'));
const lightbox = integrated.document.querySelector('.gallery-dialog');
assert.equal(lightbox.open, true);
assert.equal(lightbox.querySelector('.gallery-caption').textContent, '1 / 6');
integrated.click(lightbox.querySelector('[aria-label="Next photo"]'));
assert.equal(lightbox.querySelector('.gallery-caption').textContent, '2 / 6');
integrated.click(lightbox.querySelector('[aria-label="Close"]'));
assert.equal(lightbox.open, false);
integrated.click(integrated.$('burger'));
assert.equal(integrated.document.querySelector('.nav-dialog').open, true);
integrated.click(integrated.document.querySelector('.nav-dialog [aria-label="Close"]'));
assert.equal(integrated.document.querySelector('.nav-dialog').open, false);
console.log('Passed DOM interactions: per-finger editing, apply-all, artwork limits, drag lifecycle, positioning, rotation, colour, undo/redo, copy/reset, filters, mood matching, persistence fallbacks, design import, booking transfer and removal.');
console.log('Passed retained UI integration: all six gallery photos, lightbox open/next/close, and mobile menu open/close.');
async function checkExport() {
  click($('downloadDesign'));
  // Let the real async export handler finish after the image/blob test adapters resolve.
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.captures.images.length, 1);
  assert.equal(app.captures.downloads.length, 1);
  assert.match(app.captures.downloads[0].download, /^The-Nail-Masters-NM-[A-Z0-9]+\.png$/);
  const svg = decodeURIComponent(app.captures.images[0].split('charset=utf-8,')[1]);
  assert.match(svg, /width="1200" height="1500"/);
  assert.ok(svg.includes(D.id(state())));
  assert.equal($('downloadDesign').disabled, false);
  if (process.argv[3]) fs.writeFileSync(path.resolve(process.argv[3]), svg);
  console.log('Passed export lifecycle: 1200 x 1500 SVG image source, design ID, PNG download handoff, and button recovery. Image decoding/browser download remain browser QA.');
}
checkExport().catch(error => { console.error(error); process.exitCode = 1; });
