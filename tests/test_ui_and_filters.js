const fs = require('fs');
const assert = require('assert');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '../app/app.js'), 'utf8');

// Prüfe, ob wichtige Funktionen und Komponenten in app.js vorhanden sind
assert(appJs.includes('function classifyWinery'), 'classifyWinery fehlt in app.js');
assert(appJs.includes('function renderWineBadges'), 'renderWineBadges fehlt in app.js');
assert(appJs.includes('function renderWineCardBadges'), 'renderWineCardBadges fehlt in app.js');
assert(appJs.includes('function createSvgPin'), 'createSvgPin fehlt in app.js');
assert(appJs.includes('wineType'), 'wineType Filter fehlt in app.js');
assert(!appJs.includes('isOutlet'), 'Alte Sehenswürdigkeiten-Filter (isOutlet) sollten nicht mehr in app.js sein');
assert(!appJs.includes('isCulinary'), 'Alte Sehenswürdigkeiten-Filter (isCulinary) sollten nicht mehr in app.js sein');

console.log('Task 5 Test: UI & Filter logic code checks passed.');
