const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const pages = ['index.html', 'services.html', 'booking.html', 'contact.html', ...fs.readdirSync('services').filter(f => f.endsWith('.html')).map(f => 'services/' + f)];
let links = 0;
for (const file of pages) {
  const html = fs.readFileSync(file, 'utf8');
  const original = execFileSync('git', ['show', 'HEAD:' + file], { encoding: 'utf8' });
  const metadata = text => [...text.matchAll(/<title>[\s\S]*?<\/title>|<meta (?:name|property)="(?:description|og:[^"]+|twitter:[^"]+)"[^>]+>|<link rel="canonical"[^>]+>|<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => match[1] ? JSON.parse(match[1]) : match[0]);
  assert.deepEqual(metadata(html), metadata(original), 'SEO changed: ' + file);
  const reviews = text => [...text.matchAll(/<div class="testi-card">\s*<div class="testi-stars">[^<]*<\/div>\s*<p>([\s\S]*?)<\/p>/g)].map(match => match[1]);
  assert.deepEqual(reviews(html), reviews(original), 'Review text changed: ' + file);
  const rates = text => [...text.matchAll(/class="(?:price|dur)">([^<]+)</g)].map(match => match[1]);
  assert.deepEqual(rates(html), rates(original), 'Price/duration changed: ' + file);
  assert.equal((html.match(/<main\b/g) || []).length, 1);
  assert.equal(/onsubmit=|onerror=|onclick=|id="preloader"/.test(html), false);
  for (const match of html.matchAll(/(?:src|href)="([^"?#]+)(?:#[^"]*)?"/g)) {
    const reference = match[1];
    if (/^(?:[a-z]+:|\/\/)/i.test(reference)) continue;
    assert.equal(fs.existsSync(path.resolve(path.dirname(file), reference)), true, 'Missing local reference: ' + file + ' -> ' + reference);
    links++;
  }
}
const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]);
const files = walk('dist');
const secretPatterns = [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, /\bAKIA[0-9A-Z]{16}\b/, /\bgh[pousr]_[A-Za-z0-9]{30,}\b/, /\bsk-(?:proj-)?[A-Za-z0-9_-]{30,}\b/, /(?:postgres(?:ql)?|mongodb(?:\+srv)?):\/\/[^\s"']+/, /(?:secret|api[_-]?key|password|access[_-]?token)\s*[:=]\s*["'][A-Za-z0-9_\/-]{20,}["']/i];
for (const file of files) {
  assert.equal(/(?:^|[/\\])(?:\.env[^/\\]*|\.git|tools|node_modules)(?:[/\\]|$)/.test(file), false, 'Private/development file in output');
  if (!/\.(?:js|html|css)$/.test(file)) continue;
  const text = fs.readFileSync(file, 'utf8');
  for (const pattern of secretPatterns) assert.equal(pattern.test(text), false, 'Credential pattern detected in ' + file);
  assert.equal(/https?:\/\/(?:localhost|127\.0\.0\.1)/.test(text), false, 'Development URL in output: ' + file);
}
console.log('Passed: ' + pages.length + ' pages, ' + links + ' local references, preserved SEO/reviews/prices, and ' + files.length + ' packaged files audited for credential patterns.');
