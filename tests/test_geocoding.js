const assert = require("assert");
const { loadRuntime } = require("./runtime.cjs");

async function runTests() {
  const requested = [];
  const app = loadRuntime({
    fetch: async (url) => {
      requested.push(String(url));
      if (url === "../assets/gemeinden.json") {
        return { ok: true, json: async () => ({ "burladingen": [48.2917, 9.1122], "tübingen": [48.5216, 9.0576] }) };
      }
      throw new Error(`unexpected fetch: ${url}`);
    },
  });

  const explicit = await app.resolveCoordinates("Burladingen", { latitude: "48.1111", longitude: "9.2222" });
  assert.strictEqual(explicit.source, "config");
  assert.strictEqual(explicit.lat, 48.1111);
  assert.strictEqual(explicit.lng, 9.2222);
  assert.strictEqual(requested.length, 0, "vollständige explizite Koordinaten umgehen Geocoding");

  const zero = await app.resolveCoordinates("Nullinsel", { latitude: "0", longitude: "0" });
  assert.strictEqual(zero.lat, 0, "gültige Null-Koordinaten werden akzeptiert");
  assert.strictEqual(zero.lng, 0);

  await assert.rejects(
    app.resolveCoordinates("Burladingen", { latitude: "48.1", longitude: "" }),
    /Latitude.*gemeinsam|Koordinaten.*gemeinsam|beide Koordinaten/i,
    "ein unvollständiges Koordinatenpaar ist ein Konfigurationsfehler",
  );
  await assert.rejects(app.resolveCoordinates("Burladingen", { latitude: "91", longitude: "9" }), /ungültig|Bereich/i);
  await assert.rejects(app.resolveCoordinates("Burladingen", { latitude: "48x", longitude: "9" }), /ungültig|Zahl/i);
  assert.strictEqual(requested.length, 0, "ungültige explizite Koordinaten werden nicht durch Geocoding verdeckt");

  const offline = await app.resolveCoordinates("  TÜBINGEN  ", {});
  assert.strictEqual(offline.source, "offline");
  assert.strictEqual(offline.lat, 48.5216);
  assert.strictEqual(requested[0], "../assets/gemeinden.json", "Gemeindelookup hat einen deterministischen App-Assetpfad");

  const nominatimCalls = [];
  const online = loadRuntime({
    fetch: async (url) => {
      nominatimCalls.push(String(url));
      if (url === "../assets/gemeinden.json") return { ok: false, json: async () => ({}) };
      return { ok: true, json: async () => [{ lat: "52.5200", lon: "13.4050" }] };
    },
  });
  const nominatim = await online.resolveCoordinates("UnbekannteMusterstadt999", {});
  assert.strictEqual(nominatim.source, "nominatim");
  assert.strictEqual(nominatim.lat, 52.52);
  assert.strictEqual(nominatim.lng, 13.405);
  assert.ok(nominatimCalls[1].startsWith("https://nominatim.openstreetmap.org/search?"));

  const failed = loadRuntime({
    console: { ...console, warn() {} },
    fetch: async (url) => {
      if (url === "../assets/gemeinden.json") return { ok: false, json: async () => ({}) };
      throw new Error("Network offline");
    },
  });
  await assert.rejects(failed.resolveCoordinates("VollkommenUnbekannt12345", {}), /konnte.*nicht.*aufgelöst|Standort/i);

  const emptyNominatim = loadRuntime({
    fetch: async (url) => url === "../assets/gemeinden.json"
      ? { ok: false, json: async () => ({}) }
      : { ok: true, json: async () => [] },
  });
  await assert.rejects(emptyNominatim.resolveCoordinates("Nirgendsstadt", {}), /konnte.*nicht.*aufgelöst|Standort/i);

  const flatPath = loadRuntime({
    window: { location: { hostname: "example.org", pathname: "/index.html" } },
    fetch: async (url) => {
      assert.strictEqual(url, "assets/gemeinden.json", "flache App-Basis nutzt assets/ statt ../assets/");
      return { ok: true, json: async () => ({ "musterort": [51, 10] }) };
    },
  });
  assert.strictEqual((await flatPath.resolveCoordinates("Musterort", {})).source, "offline");

  const invalidApp = loadRuntime({
    document: { body: { classList: { add() { throw new Error("Fullscreen darf nicht aktiviert werden"); }, remove() {}, contains() { return false; } }, style: { removeProperty() {} }, appendChild() {} } },
    fetch: async (url) => url === "../assets/gemeinden.json"
      ? { ok: false, json: async () => ({}) }
      : { ok: true, json: async () => [] },
  });
  const root = { innerHTML: "" };
  await invalidApp.app({ ort: "Nirgendsstadt" }, root);
  assert.match(root.innerHTML, /Standort|Koordinaten/);
  assert.doesNotMatch(root.innerHTML, /sw-fullscreen-wrapper/);

  console.log("✅ test_geocoding: echte Runtime mit injiziertem Fetch, ohne stillen Burladingen-Fallback");
}

runTests().catch((error) => {
  console.error("❌ Geocoding test failed:", error);
  process.exitCode = 1;
});
