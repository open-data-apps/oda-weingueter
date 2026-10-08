const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "app-package.json"), "utf8"));
const changelog = fs.readFileSync(path.join(root, "CHANGELOG.md"), "utf8");

function pngOrientation(relative) {
  const bytes = fs.readFileSync(path.join(root, relative));
  assert.ok(bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex")), `${relative} must have a PNG signature`);
  assert.strictEqual(bytes.readUInt32BE(8), 13, `${relative} must have a 13-byte IHDR chunk`);
  assert.strictEqual(bytes.toString("ascii", 12, 16), "IHDR", `${relative} must start with an IHDR chunk`);
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  assert.ok(width > 0 && height > 0, `${relative} must have positive dimensions`);
  return width > height ? "landscape" : height > width ? "portrait" : "square";
}

assert.strictEqual(pkg.name, "Weingüter & Weingenuss", "App-Name muss erhalten bleiben");
assert.strictEqual(pkg["name-in-url"], "weingueter", "name-in-url muss erhalten bleiben");
assert.match(pkg["app-version"], /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/, "app-version muss SemVer sein");
const latestEntry = changelog.match(/^## (\d+\.\d+\.\d+) - \d{4}-\d{2}-\d{2}$/m);
assert.ok(latestEntry, "Changelog braucht einen datierten SemVer-Eintrag");
assert.strictEqual(pkg["app-version"], latestEntry[1], "app-version muss zur neuesten Changelog-Version passen");

const expectedScreenshots = [
  "assets/Desktop_Screenshot.png",
  "assets/Desktop_Screenshot_2.png",
  "assets/Desktop_Screenshot_3.png",
  "assets/Mobile_Screenshot.png",
  "assets/Mobile_Screenshot_2.png",
  "assets/Mobile_Screenshot_3.png",
];
assert.deepStrictEqual(pkg.screenshots, expectedScreenshots, "Paket muss die sechs aktuellen Screenshots in Desktop-/Mobile-Reihenfolge aufführen");
assert.strictEqual(new Set(pkg.screenshots).size, 6, "sechs Screenshot-Referenzen müssen verschieden sein");
const orientations = pkg.screenshots.map(pngOrientation);
assert.strictEqual(orientations.filter((orientation) => orientation === "landscape").length, 3, "drei PNGs müssen Querformat haben");
assert.strictEqual(orientations.filter((orientation) => orientation === "portrait").length, 3, "drei PNGs müssen Hochformat haben");
assert.strictEqual(orientations.filter((orientation) => orientation === "square").length, 0, "Screenshots dürfen nicht quadratisch sein");

assert.deepStrictEqual(pkg.beschreibung, pkg["instanz-config"].beschreibung.default, "Beschreibung muss exakt gespiegelt sein");
assert.strictEqual(pkg.beschreibung[0], "_multiline_", "Beschreibung beginnt mit _multiline_");
const markdownText = pkg.beschreibung.slice(1).join("\n");
assert.ok(!/<[a-z][\s\S]*>/i.test(markdownText), "Markdown enthält keine HTML-Tags");

const cfg = pkg["instanz-config"];
assert.strictEqual(cfg.radiusKm.default, "25", "Standardradius bleibt 25 km");
assert.deepStrictEqual(cfg.radiusKm.format.optionen, ["5", "10", "25", "50", "100"], "Radiusauswahl ist auf genehmigte Werte begrenzt");
assert.ok(["de", "en"].includes(cfg.standardSprache.default), "Standardsprache muss de oder en sein");
assert.deepStrictEqual(cfg.standardSprache.format.optionen, ["de", "en"], "Sprachauswahl unterstützt de/en");
assert.ok(!Object.hasOwn(cfg, "proxyAktiv"), "DZT-Relay-Konfiguration darf keinen wirkungslosen Proxy-Schalter anbieten");
if (cfg.brandingCSSFile.default) {
  assert.doesNotThrow(
    () => new URL(cfg.brandingCSSFile.default),
    "Ein vorbelegter CSS-Dateilink muss absolut sein, damit das URL-Feld im ODAS-Editor speicherbar ist",
  );
}

console.log("✅ test_package_metadata: SemVer/Changelog und freigegebene Laufzeitkonfiguration");
