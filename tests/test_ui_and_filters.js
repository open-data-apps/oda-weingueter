const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { loadRuntime, makeRoot, makePoi, makeElement } = require("./runtime.cjs");

const app = loadRuntime();
const root = makeRoot();
const pois = Array.from({ length: 75 }, (_, index) => ({
  ...makePoi(index),
  imageUrl: `https://images.example.test/${index}.jpg`,
}));
const state = {
  uid: "sw_test",
  root,
  filteredPois: pois,
  sourceLimitReached: true,
};
app.renderCatalogGrid(state);
const catalog = root.querySelector("#sw_test-catalog-grid").innerHTML;
assert.strictEqual((catalog.match(/class="sw-catalog-card"/g) || []).length, 75, "alle gefilterten geladenen POIs oberhalb von 60 erscheinen im Katalog");
assert.ok(catalog.includes("Die DZT-Abfrage liefert höchstens 300 Einträge"), "erreichte Quellgrenze wird ehrlich angezeigt");
assert.ok(catalog.includes('loading="lazy"'), "weiter unten liegende Katalogbilder nutzen natives Lazy Loading");

const css = fs.readFileSync(path.join(__dirname, "../app/app.css"), "utf8");
assert.match(css, /\.sw-catalog-card:focus-visible/, "Katalogkarten haben einen sichtbaren Tastaturfokus");
assert.match(css, /\.sw-clean-card:focus-visible/, "Drawer-Karten haben einen sichtbaren Tastaturfokus");

const actions = [];
app.openDetailModal = (_state, id) => actions.push(["detail", id]);
app.focusPoiOnMap = (_state, id) => actions.push(["focus", id]);
const actionState = { allPois: [], map: null };
const actionRoot = makeRoot();
app.registerSwActionHandler(actionRoot, actionState);
const card = new app.Element({ swAction: "open-detail", swPoiId: "catalog-1" });
card.closest = (selector) => ["[data-sw-action]", ".sw-catalog-card[data-sw-action], .sw-clean-card[data-sw-action]"].includes(selector) ? card : null;
let cardDefaultPrevented = false;
actionRoot.dispatch("keydown", {
  target: card,
  key: "Enter",
  preventDefault() { cardDefaultPrevented = true; },
});
assert.deepStrictEqual(actions, [["detail", "catalog-1"]], "Enter öffnet die fokussierte Katalogkarte genau einmal");
assert.strictEqual(cardDefaultPrevented, true, "Enter löst keine zusätzliche Standardaktion aus");

actions.length = 0;
const button = new app.Element({ swAction: "open-detail", swPoiId: "catalog-2" });
button.closest = (selector) => {
  if (selector === "[data-sw-action]") return button;
  if (selector === ".sw-catalog-card[data-sw-action], .sw-clean-card[data-sw-action]") return card;
  return null;
};
actionRoot.dispatch("keydown", { target: button, key: " " , preventDefault() {} });
assert.deepStrictEqual(actions, [], "verschachtelte Aktionsbuttons werden nicht zusätzlich durch die Karten-Keydown-Semantik ausgelöst");

actions.length = 0;
const drawerCard = new app.Element({ swAction: "focus-poi", swPoiId: "drawer-1" });
drawerCard.closest = (selector) => ["[data-sw-action]", ".sw-catalog-card[data-sw-action], .sw-clean-card[data-sw-action]"].includes(selector) ? drawerCard : null;
actionRoot.dispatch("keydown", { target: drawerCard, key: " ", preventDefault() {} });
assert.deepStrictEqual(actions, [["focus", "drawer-1"]], "Leertaste fokussiert den zugehörigen Kartenort aus dem Drawer");

const schale4 = app.renderSchale4SourceMarkup({
  config: {
    datenStand: '<Stand & Quelle>',
    datenquelleHinweis: "<p>Methodik</p>",
    weiterfuehrendeLinks: '<ul><li><a href="https://example.test">Link</a></li></ul>',
  },
});
assert.ok(schale4.includes("&lt;Stand &amp; Quelle&gt;"), "datenStand wird als Text escaped");
assert.ok(schale4.includes("<p>Methodik</p>"), "gerendertes datenquelleHinweis-HTML bleibt im Methodikbereich erhalten");
assert.ok(schale4.includes('<a href="https://example.test">Link</a>'), "gerendertes weiterfuehrendeLinks-HTML bleibt im Methodikbereich erhalten");

const documentListeners = {};
let activeLightbox = null;
const lightboxNode = makeElement();
lightboxNode.setAttribute = () => {};
lightboxNode.remove = function() { this.parentNode = null; };
lightboxNode.addEventListener = () => {};
const lightboxRuntime = loadRuntime({
  document: {
    addEventListener(type, handler) { (documentListeners[type] ||= []).push(handler); },
    removeEventListener(type, handler) { documentListeners[type] = (documentListeners[type] || []).filter((item) => item !== handler); },
    getElementById() { return null; },
    querySelectorAll() { return []; },
    createElement() { return lightboxNode; },
    body: {
      classList: { add() {}, remove() {}, contains() { return false; } },
      style: { removeProperty() {} },
      appendChild(node) { node.parentNode = this; activeLightbox = node; },
    },
  },
});
lightboxRuntime.openLightbox({
  name: "Galerie Weingut",
  images: [{ url: "https://example.test/photo.jpg", license: "https://creativecommons.org/publicdomain/zero/1.0/", copyright: "", sourceUrl: "" }],
});
assert.ok(lightboxRuntime.window.__swActiveLightboxCleanup, "Lightbox registriert einen page-leave-Cleanup");
assert.strictEqual(documentListeners.keydown.length, 1, "Lightbox hängt genau einen globalen Tastaturhandler ein");
lightboxRuntime.onPageLeave("beschreibung");
assert.strictEqual(activeLightbox.parentNode, null, "PageLeave entfernt die angehängte Lightbox");
assert.strictEqual(documentListeners.keydown.length, 0, "PageLeave entfernt den globalen Tastaturhandler");
assert.strictEqual(lightboxRuntime.window.__swActiveLightboxCleanup, null, "Cleanup-Referenz wird freigegeben");

console.log("✅ test_ui_and_filters: reale Katalog-, Tastatur- und Schale-4-Runtime");
