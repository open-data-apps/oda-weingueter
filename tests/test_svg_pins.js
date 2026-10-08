const assert = require("assert");
const { loadRuntime } = require("./runtime.cjs");

const app = loadRuntime();
const cases = [
  ["center", [], "#d97706", "★"],
  ["poi", ["weingut"], "#881337", "🍇"],
  ["poi", ["besen"], "#15803d", "🌿"],
  ["poi", ["vinothek"], "#9333ea", "🍾"],
  ["poi", ["weinstube"], "#b45309", "🏮"],
  ["poi", ["probe"], "#0284c7", "🥂"],
];

cases.forEach(([type, categories, color, glyph]) => {
  const svg = app.createSvgPin(type, categories);
  assert.ok(svg.includes(`fill="${color}"`), `${categories.join() || type} erhält die passende Pin-Farbe`);
  assert.ok(svg.includes(glyph), `${categories.join() || type} erhält das passende Symbol`);
  assert.ok(svg.includes('viewBox="0 0 32 42"'), "SVG hat die vorgesehene ViewBox");
  assert.ok(svg.includes('dominant-baseline="central"'), "SVG-Symbol bleibt zentriert");
});

console.log("✅ test_svg_pins: echte createSvgPin()-Runtime geprüft");
