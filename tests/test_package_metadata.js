const assert = require('assert');
const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '../app-package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

assert.strictEqual(pkg.name, 'Weingüter & Weingenuss', 'App-Name muss "Weingüter & Weingenuss" sein');
assert.strictEqual(pkg['name-in-url'], 'weingueter', 'name-in-url muss "weingueter" sein');
assert.strictEqual(pkg['app-version'], '1.0.0', 'app-version muss "1.0.0" sein');

// Prüfe Multiline-Gleichheit
assert.deepStrictEqual(pkg.beschreibung, pkg['instanz-config'].beschreibung.default, 'Top-Level beschreibung und instanz-config.beschreibung.default müssen exakt übereinstimmen');
assert.strictEqual(pkg.beschreibung[0], '_multiline_', 'Erstes Element muss "_multiline_" sein');

// Prüfe: Keine HTML-Tags in Markdown-Feldern
const markdownText = pkg.beschreibung.slice(1).join('\n');
assert.ok(!/<[a-z][\s\S]*>/i.test(markdownText), 'Markdown enthält verbotene HTML-Tags');

// Prüfe instanz-config Schlüsselfelder
const cfg = pkg['instanz-config'];
assert.strictEqual(cfg.ort.default, 'Vaihingen an der Enz', 'Standard-Ort muss "Vaihingen an der Enz" sein');
assert.strictEqual(cfg.latitude.default, '48.9328', 'Standard-Latitude muss "48.9328" sein');
assert.strictEqual(cfg.longitude.default, '8.9564', 'Standard-Longitude muss "8.9564" sein');
assert.strictEqual(cfg.radiusKm.default, '25', 'Standard-Radius muss "25" sein');
assert.strictEqual(cfg.proxyAktiv.default, 'nein', 'proxyAktiv muss "nein" sein (DZT Relay)');

console.log('Task 2 Test: package metadata check passed.');
