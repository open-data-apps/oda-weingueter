const assert = require('assert');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../assets/demo-weingueter.json');
assert.ok(fs.existsSync(filePath), 'Datei assets/demo-weingueter.json muss existieren');

const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

assert.ok(Array.isArray(data), 'Demo-Daten müssen ein Array sein');
assert.ok(data.length >= 10, `Mindestens 10 Demo-Weingüter erforderlich (aktuell: ${data.length})`);

data.forEach((item, index) => {
  assert.ok(item['@id'], `Eintrag ${index} (${item['schema:name'] || 'ohne Name'}) fehlt @id`);
  assert.ok(item['schema:name'], `Eintrag ${index} fehlt schema:name`);
  assert.ok(item['schema:geo'], `Eintrag ${index} (${item['schema:name']}) fehlt schema:geo`);
  assert.ok(item['schema:geo']['schema:latitude'], `Eintrag ${index} fehlt latitude`);
  assert.ok(item['schema:geo']['schema:longitude'], `Eintrag ${index} fehlt longitude`);
  assert.ok(item['schema:address'], `Eintrag ${index} fehlt schema:address`);
  assert.ok(item['schema:address']['schema:addressLocality'], `Eintrag ${index} fehlt addressLocality`);
});

console.log(`Task 3 Test: ${data.length} Demo-Weingüter erfolgreich validiert.`);
