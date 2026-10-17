// Optional packaging only: the source pages themselves remain deployable static HTML.
const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const target = path.resolve(root, 'dist');
const files = ['index.html', 'services.html', 'booking.html', 'contact.html', 'style.css', 'services.css', 'premium.css', 'main.js', 'services.js', 'motion.js', 'hero-3d.js', 'nail-canvas.css', 'nail-design.js', 'nail-canvas.js', 'nail-booking.js', 'serene-luxe.css', 'serene-luxe.js', '_headers', ...fs.readdirSync('services').filter(f => f.endsWith('.html')).map(f => 'services/' + f)];
// Copy only assets referenced by pages, stylesheets, and the optional runtime interface.
const assets = new Set();
for (const file of files.filter(f => f.endsWith('.html'))) {
  const html = fs.readFileSync(file, 'utf8');
  for (const match of html.matchAll(/(?:src|href)="((?:\.\.\/)?assets\/[^"?#]+)"/g)) assets.add(match[1].replace(/^\.\.\//, ''));
  for (const match of html.matchAll(/srcset="([^"]+)"/g)) for (const variant of match[1].split(',')) assets.add(variant.trim().split(/\s/)[0].replace(/^\.\.\//, ''));
}
for (const asset of [...assets]) {
  if (asset.endsWith('.css')) {
    for (const match of fs.readFileSync(asset, 'utf8').matchAll(/url\(([^)]+)\)/g)) {
      const reference = match[1].trim().replace(/^['"]|['"]$/g, '');
      if (!/^(?:[a-z]+:|\/\/)/i.test(reference)) assets.add(path.posix.join(path.posix.dirname(asset), reference));
    }
  }
}
const optionalDirectory = path.resolve(root, 'assets/spline');
if (fs.existsSync(optionalDirectory)) {
  const collect = directory => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) collect(file);
      else if (/\.(?:js|mjs|wasm|splinecode|json|bin|glb|gltf|hdr|png|jpe?g|webp|ktx2)$/i.test(entry.name)) assets.add(path.relative(root, file).replace(/\\/g, '/'));
    }
  };
  collect(optionalDirectory);
}
const output = [...files, ...assets];
for (const file of output) {
  const destination = path.resolve(target, file);
  if (!destination.startsWith(target + path.sep)) throw new Error('Invalid output path');
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(path.resolve(root, file), destination);
}
// Fail if an old output directory contains unexpected files; never silently ship them.
const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.relative(target, path.join(directory, entry.name)).replace(/\\/g, '/')]);
const unexpected = walk(target).filter(file => !output.includes(file));
if (unexpected.length) throw new Error('Unexpected files in dist: ' + unexpected.join(', '));
console.log('Packaged ' + output.length + ' static files into dist. No server runtime required.');
