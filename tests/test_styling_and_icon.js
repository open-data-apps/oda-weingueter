const fs = require('fs');
const assert = require('assert');
const path = require('path');

// 1. Icon Test
const iconPath = path.join(__dirname, '../assets/odas-app-icon.svg');
assert(fs.existsSync(iconPath), 'assets/odas-app-icon.svg existiert nicht');
const iconContent = fs.readFileSync(iconPath, 'utf8');
assert(iconContent.includes('viewBox="0 0 512 512"'), 'Icon muss 512x512 ViewBox haben');
assert(iconContent.includes('rx="108"'), 'ODAS Standard rx=108 erforderlich');
assert(iconContent.includes('#881337'), 'Wein-Farbton #881337 muss im Icon vorkommen');

// 2. CSS Stylesheet Test
const cssPath = path.join(__dirname, '../app/app.css');
assert(fs.existsSync(cssPath), 'app/app.css existiert nicht');
const cssContent = fs.readFileSync(cssPath, 'utf8');

const requiredClasses = [
  '.sw-pill-alle',
  '.sw-pill-weingut',
  '.sw-pill-vinothek',
  '.sw-pill-besen',
  '.sw-pill-weinstube',
  '.sw-pill-probe',
  '.sw-tag-weingut',
  '.sw-tag-vinothek',
  '.sw-tag-besen',
  '.sw-tag-weinstube',
  '.sw-tag-probe'
];

requiredClasses.forEach(cls => {
  assert(cssContent.includes(cls), `CSS-Klasse ${cls} fehlt in app/app.css`);
});

assert(!cssContent.includes('.sw-pill-kids'), 'Alte Klasse .sw-pill-kids sollte entfernt sein');
assert(!cssContent.includes('.sw-tag-kids'), 'Alte Klasse .sw-tag-kids sollte entfernt sein');

console.log('Task 6 Test: Styling & Icon checks passed.');
