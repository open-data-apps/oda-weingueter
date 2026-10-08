// F-149/F-150 Regression: POI-IDs und Rohdaten-JSON dürfen nicht in
// Inline-JavaScript-Attributen (onclick="…") landen. Erwartet werden
// data-Attribute plus delegierter Klick-Handler (registerSwActionHandler).
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const appJs = fs.readFileSync(path.join(__dirname, "../app/app.js"), "utf8");

// Quellebene: Inline-JS-Senken für Datenwerte sind vollständig entfernt.
assert.ok(!/onclick="window\.sw(OpenDetail|FocusPoi)_/.test(appJs), "F-149: kein onclick mit swOpenDetail/swFocusPoi und POI-ID");
assert.ok(!/onclick="navigator\.clipboard\.writeText\(\$\{/.test(appJs), "F-150: kein JSON.stringify(rawJson) im onclick-Attribut");
assert.ok(/function registerSwActionHandler/.test(appJs), "delegierter Aktions-Handler vorhanden");
assert.ok(/data-sw-action="open-detail"/.test(appJs) && /data-sw-action="focus-poi"/.test(appJs), "data-sw-action-Attribute vorhanden");
assert.ok(/data-sw-copy="/.test(appJs), "Kopier-Button nutzt data-sw-copy");
assert.ok(/function safeHttpUrl/.test(appJs), "safeHttpUrl-Validator vorhanden");
assert.ok(!/href="\$\{escapeHtml\(poi\.(url|hasMenu)\)\}"/.test(appJs), "href nur mit safeHttpUrl-validierten URLs");

// Verhalten: gerenderte Karten mit Payload-ID enthalten keine Inline-JS-Senke.
const sandbox = {
  console,
  process,
  require,
  __dirname: path.join(__dirname, "../app"),
  window: {},
  document: { readyState: "complete", addEventListener: () => {}, querySelector: () => null, querySelectorAll: () => [], body: { classList: { add: () => {}, remove: () => {} } } },
  sessionStorage: { getItem: () => null, setItem: () => {} },
  navigator: {},
  fetch: async () => { throw new Error("kein Netzwerk im Test"); },
  URL,
  URLSearchParams,
  AbortController,
  Response: typeof Response !== "undefined" ? Response : function () {},
  Headers: typeof Headers !== "undefined" ? Headers : function () {},
  Map,
  Set,
  setTimeout,
  clearTimeout,
};
vm.createContext(sandbox);
vm.runInContext(appJs, sandbox, { filename: "app/app.js" });

const payloadId = "wg');window.__auditXss='wine-inline';//";
const payloadPoi = {
  id: payloadId,
  name: "Payload Weingut",
  description: "Beschreibung",
  imageUrl: "",
  distanceKm: 1.2,
  lat: 48.74,
  lng: 9.3,
  street: "Weinweg 1",
  plz: "70173",
  city: "Stuttgart",
  telephone: "0711 1",
  url: "https://example.org/wg",
  categories: ["weingut"],
  isBesen: false,
  isVinothek: false,
  isWeinstube: false,
  isProbe: false,
};

function mockElement() {
  return {
    _html: "",
    textContent: "",
    disabled: false,
    set innerHTML(v) { this._html = v; },
    get innerHTML() { return this._html; },
  };
}
function makeState(uid) {
  const elements = new Map();
  return {
    uid,
    page: 0,
    pageSize: 10,
    sortBy: "dist_asc",
    root: { querySelector: (sel) => { if (!elements.has(sel)) elements.set(sel, mockElement()); return elements.get(sel); } },
    filteredPois: [payloadPoi],
  };
}

const catalogState = makeState("sw_1");
sandbox.renderCatalogGrid(catalogState);
const catalogHtml = catalogState.root.querySelector("#sw_1-catalog-grid").innerHTML;
assert.ok(!catalogHtml.includes("onclick="), "F-149: Katalogkarte ohne onclick-Attribut");
assert.ok(catalogHtml.includes('data-sw-action="open-detail"'), "Katalogkarte mit data-sw-action");
assert.ok(catalogHtml.includes("wg&#039;);"), "Payload-ID HTML-escapad als Attributwert");

const drawerState = makeState("sw_2");
sandbox.renderDrawerList(drawerState);
const drawerHtml = drawerState.root.querySelector("#sw_2-drawer-list").innerHTML;
assert.ok(!drawerHtml.includes("onclick="), "F-149: Listeneintrag ohne onclick-Attribut");
assert.ok(drawerHtml.includes('data-sw-action="focus-poi"') || drawerHtml.includes('data-sw-action="open-detail"'), "Listeneintrag mit data-sw-action");

console.log("✅ test_xss_regression: keine Inline-JS-Senken für DZT-Daten (F-149/F-150)");
