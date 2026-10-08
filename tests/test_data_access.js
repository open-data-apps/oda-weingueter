const assert = require("assert");
const { loadRuntime, makeStorage, makeRoot } = require("./runtime.cjs");

const ENDPOINT = "https://proxy.opendatagermany.io/api/ts/v1/kg/sparql";
const validState = (overrides = {}) => ({
  lat: 48.9328,
  lng: 8.9564,
  umkreis: 25,
  ort: "Vaihingen an der Enz",
  standardSprache: "de",
  config: { apiurls: [{ name: "dztsparql", url: ENDPOINT }] },
  ...overrides,
});
const response = (status, data) => ({
  status,
  ok: status >= 200 && status < 300,
  json: async () => data,
});

async function runTests() {
  const assetPaths = loadRuntime();
  assert.strictEqual(assetPaths.getOdasAssetPath("odas-app-icon.svg"), "../assets/odas-app-icon.svg", "ODAS-/app/ nutzt den deterministischen Geschwisterpfad zu assets/");
  const flatAssetPaths = loadRuntime({ window: { location: { hostname: "example.org", pathname: "/index.html" } } });
  assert.strictEqual(flatAssetPaths.getOdasAssetPath("odas-app-icon.svg"), "assets/odas-app-icon.svg", "flache App-Basis nutzt assets/");

  const localCalls = [];
  const demo = [{
    "@id": "synthetic",
    "schema:name": "Demo-Synthetisches Beispiel",
    "schema:license": "https://opensource.org/license/mit",
    "schema:sdPublisher": { "schema:name": "Ondics GmbH" },
    "schema:image": {
      "schema:contentUrl": "assets/demo-weingueter.svg",
      "schema:license": "https://opensource.org/license/mit",
      "schema:copyrightNotice": "Copyright Ondics GmbH",
    },
  }];
  const local = loadRuntime({
    window: { location: { hostname: "localhost", pathname: "/app/index.html" } },
    fetch: async (url) => {
      localCalls.push(String(url));
      return url === "../assets/demo-weingueter.json" ? response(200, demo) : response(404, {});
    },
  });
  const localState = validState({ config: { apiurls: [], demoPois: [{ "@id": "must-not-use" }] } });
  const localPois = await local.loadDztData(localState);
  assert.strictEqual(localPois[0]["@id"], "synthetic", "Loopback lädt die lokale synthetische Fixture statt config.demoPois");
  assert.strictEqual(localPois[0]["schema:image"]["schema:contentUrl"], "http://localhost/assets/demo-weingueter.svg", "nur der lokale Demo-Ladepfad löst das freigegebene relative Asset absolut auf");
  const demoPoi = local.normalizeDztPoi(localPois[0], 48, 9);
  assert.strictEqual(demoPoi.dataLicense.attribution, "Ondics GmbH", "schema:sdPublisher wird als Datenherausgeber gelesen");
  assert.strictEqual(demoPoi.images[0].license, "https://opensource.org/license/mit");
  assert.strictEqual(demoPoi.images[0].copyright, "Copyright Ondics GmbH");
  assert.deepStrictEqual(localCalls, ["../assets/demo-weingueter.json"], "lokale /app/index.html-Route nutzt deterministischen Geschwisterpfad");
  assert.strictEqual(localState.demoMode, true, "lokale Fixture setzt den sichtbaren Demo-Modus");
  localState.uid = "sw_demo";
  localState.root = makeRoot();
  local.updateSourceNotice(localState);
  assert.strictEqual(localState.root.querySelector("#sw_demo-source-notice").textContent, "Synthetische Demodaten – keine Live-Daten");

  const flatLocal = loadRuntime({
    window: { location: { hostname: "127.0.0.1", pathname: "/index.html" } },
    fetch: async (url) => {
      assert.strictEqual(url, "assets/demo-weingueter.json");
      return response(200, demo);
    },
  });
  await flatLocal.loadDztData(validState());

  const productionCalls = [];
  const production = loadRuntime({
    window: { location: { hostname: "portal.example.org", pathname: "/view/app/1/app/" } },
    fetch: async (url) => {
      productionCalls.push(String(url));
      return response(500, {});
    },
  });
  await assert.rejects(production.loadDztData(validState({ config: { apiurls: [{ name: "dztsparql", url: ENDPOINT }], demoPois: demo } })), /HTTP 500|Status 500/i);
  assert.strictEqual(productionCalls.length, 1, "HTTP-500 wird ohne nachgelagerten Demo-Fetch als Fehler gemeldet");
  assert.ok(productionCalls[0].includes("/dzt?path="), "DZT-Abruf bleibt über den Store-Relay");
  assert.ok(productionCalls[0].length < 7800, `Der doppelt kodierte Relay-GET muss unter der 8-KiB-Request-Line-Grenze bleiben (${productionCalls[0].length} Zeichen)`);
  assert.ok(!productionCalls.some((url) => url.includes("demo-weingueter")), "Produktivbetrieb darf die lokale Demo-Datei nie anfragen");

  const malformedCalls = [];
  const malformed = loadRuntime({
    window: { location: { hostname: "portal.example.org", pathname: "/app/" } },
    fetch: async (url) => {
      malformedCalls.push(String(url));
      return response(200, { unexpected: [] });
    },
  });
  await assert.rejects(malformed.loadDztData(validState()), /Antwortstruktur|SPARQL|unerwartet/i);
  assert.strictEqual(malformedCalls.length, 1, "falsches HTTP-200-JSON wird nicht als leer oder Demo behandelt");

  const legacyArray = loadRuntime({
    window: { location: { hostname: "portal.example.org", pathname: "/app/" } },
    fetch: async () => response(200, [{ "@id": "legacy" }]),
  });
  await assert.rejects(legacyArray.loadDztData(validState()), /Antwortstruktur|SPARQL|unerwartet/i, "Netzwerk-JSON-LD-Arrays werden nicht als lokale Fixture akzeptiert");

  const invalidJsonCalls = [];
  const invalidJson = loadRuntime({
    window: { location: { hostname: "portal.example.org", pathname: "/app/" } },
    fetch: async (url) => {
      invalidJsonCalls.push(String(url));
      return { status: 200, ok: true, json: async () => { throw new SyntaxError("bad JSON"); } };
    },
  });
  await assert.rejects(invalidJson.loadDztData(validState()), /JSON|bad JSON/i);
  assert.strictEqual(invalidJsonCalls.length, 1, "defektes JSON bleibt ein Fehler ohne Demo-Fetch");

  const noSourceCalls = [];
  const noSource = loadRuntime({
    window: { location: { hostname: "portal.example.org", pathname: "/app/" } },
    fetch: async (url) => { noSourceCalls.push(String(url)); return response(200, { results: { bindings: [] } }); },
  });
  const noSourceState = validState({ config: { apiurls: [{ name: "other", url: `${ENDPOINT}?sparql=1` }] } });
  assert.deepStrictEqual(Array.from(await noSource.loadDztData(noSourceState)), []);
  assert.strictEqual(noSourceState.dataSourceMissing, true);
  noSourceState.uid = "sw_missing";
  noSourceState.root = makeRoot();
  noSource.updateSourceNotice(noSourceState);
  assert.match(noSourceState.root.querySelector("#sw_missing-source-notice").textContent, /keine .*Datenquelle konfiguriert/i);
  assert.strictEqual(noSourceCalls.length, 0, "fehlendes dztsparql erzeugt keinen stillen Standardrequest");

  const badSourceCalls = [];
  const badSource = loadRuntime({
    window: { location: { hostname: "portal.example.org", pathname: "/app/" } },
    fetch: async (url) => { badSourceCalls.push(String(url)); return response(200, { results: { bindings: [] } }); },
  });
  await assert.rejects(badSource.loadDztData(validState({ config: { apiurls: [{ name: "dztsparql", url: "https://api.example.org/sparql" }] } })), /DZT-SPARQL|Endpunkt|Quelle/i);
  assert.strictEqual(badSourceCalls.length, 0, "abweichende URL wird nicht durch Sparql-Heuristik oder Defaultendpoint ersetzt");

  const languageCalls = [];
  const languageApp = loadRuntime({
    window: { location: { hostname: "portal.example.org", pathname: "/app/" } },
    fetch: async (url) => { languageCalls.push(String(url)); return response(200, { results: { bindings: [] } }); },
  });
  const languageState = validState({ standardSprache: "en" });
  assert.deepStrictEqual(Array.from(await languageApp.loadDztData(languageState)), [], "gültiges results.bindings:[] ist ein echter Leerzustand");
  const relay = new URL(languageCalls[0], "https://portal.example.org");
  const relayPath = relay.searchParams.get("path");
  const query = new URLSearchParams(relayPath.split("?")[1]).get("query");
  assert.match(query, /LANG\(\?\w+\)\)="en"/, "standardSprache=en fließt auch in die kompakte SPARQL-Abfrage ein");
  for (const field of ["namePreferred", "descPreferred", "dataLicense", "dataLicenseAuthors", "dataLicenseCopyrightHolders", "imageRecords"]) {
    assert.ok(query.includes(`AS?${field}`), `öffentlicher SPARQL-Ergebnisname ${field} bleibt erhalten`);
  }
  const geoLiteral = query.match(/con:query("(?:\\.|[^"\\])*")/)[1];
  const shape = JSON.parse(JSON.parse(geoLiteral)).query.geo_shape.geometry.shape;
  assert.deepStrictEqual(shape.coordinates, [8.9564, 48.9328]);
  assert.strictEqual(shape.radius, "25km");
  assert.ok(query.includes('separator=" · "'), "Attributionstrenner innerhalb von Literalen wird nicht verändert");
  await languageApp.loadDztData(validState({ lat: -89.12345678901234, lng: -179.12345678901234, umkreis: 100 }));
  assert.ok(languageCalls.every((url) => url.length < 7800), "auch lange Koordinaten bleiben mit Reserve unter 8 KiB");

  [5, 10, 25, 50, 100].forEach((radius) => assert.strictEqual(languageApp.normalizeRadiusKm(String(radius)), radius));
  assert.strictEqual(languageApp.getConfiguredRadiusKm({ radiusKm: "5", umkreis: "100" }), 5, "nur radiusKm wird ausgewertet");
  assert.strictEqual(languageApp.getConfiguredRadiusKm({ radiusKm: "12", umkreis: "50" }), 25, "ungenehmigte Werte fallen auf den Standardradius zurück");

  const cacheStorage = makeStorage();
  cacheStorage.setItem("wg_dzt_cache_v1_48.9328_8.9564_25", JSON.stringify({ timestamp: Date.now(), data: [{ legacy: true }] }));
  let cacheCalls = 0;
  const cachedRuntime = loadRuntime({
    sessionStorage: cacheStorage,
    window: { location: { hostname: "portal.example.org", pathname: "/app/" } },
    fetch: async () => { cacheCalls++; return response(200, { results: { bindings: [] } }); },
  });
  const cacheState = validState();
  const currentData = await cachedRuntime.loadDztData(cacheState);
  assert.strictEqual(currentData.length, 0, "versionsweise Cache-Invalidierung verwirft den alten Session-Eintrag");
  await cachedRuntime.loadDztData(cacheState);
  assert.strictEqual(cacheCalls, 1, "identische Abfrage kann im Session-Cache liegen");
  cacheState.standardSprache = "en";
  await cachedRuntime.loadDztData(cacheState);
  assert.strictEqual(cacheCalls, 2, "Cache-Key berücksichtigt die Abfragesprache");
  cacheState.umkreis = 50;
  await cachedRuntime.loadDztData(cacheState);
  assert.strictEqual(cacheCalls, 3, "Cache-Key berücksichtigt den Suchradius");

  console.log("✅ test_data_access: lokale Demo-Grenze, API-Fehler, Quellenvertrag, Sprache und Cache");
}

runTests().catch((error) => {
  console.error("❌ data access test failed:", error);
  process.exitCode = 1;
});
