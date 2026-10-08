const assert = require("assert");
const { loadRuntime } = require("./runtime.cjs");

const app = loadRuntime();
const query = app.buildDztSparqlQuery(48.9328, 8.9564, 25, "en");

assert.ok(query.includes("schema:Winery"), "SPARQL muss schema:Winery selektieren");
assert.ok(!query.includes("schema:TouristAttraction"), "SPARQL darf keine fremden Typen selektieren");
assert.ok(query.includes("schema:telephone"), "SPARQL muss telephone selektieren");
assert.ok(query.includes("LIMIT 300"), "SPARQL-Quellgrenze bleibt bei 300");
assert.ok(query.includes('LANG(?namePreferredVal)') && query.includes('= "en"'), "Abfrage berücksichtigt die bevorzugte Sprache");
["descAnyVal", "descPreferredVal", "descDeVal", "descNeutralVal"].forEach((field) => {
  assert.ok(query.includes(`schema:description/schema:text? ?${field}`), `${field} unterstützt direkte Beschreibungen und CreativeWork/text`);
  assert.ok(query.includes(`FILTER(isLiteral(?${field})`), `${field} schließt Beschreibungs-IRIs aus`);
});
assert.ok(query.includes("GROUP_CONCAT") && query.includes("ENCODE_FOR_URI"), "Bildmetadaten werden als zusammengehörige, kodierte Records gruppiert");
["schema:license ?directDataLicenseValue", "schema:publisher ?publisherNode", "schema:sdPublisher ?sdPublisherNode", "schema:creditText ?imageCreditValue", "schema:creator ?imageCreatorNode", "schema:copyrightNotice ?imageCopyrightValue", "schema:url ?imageSourceValue"].forEach((field) => {
  assert.ok(query.includes(field), `SPARQL fragt Rechtefeld ${field} ab`);
});
assert.ok(!query.includes('GROUP_CONCAT(DISTINCT ?imgUrl'), "Bild-URLs dürfen nicht unabhängig von ihren Rechten gruppiert werden");
assert.ok(query.includes("?s schema:sdLicense ?dataLicenseNode") && query.includes("?dataLicenseNode schema:license ?linkedDataLicenseValue"), "Datenlizenz folgt dem dokumentierten sdLicense-Knotenpfad");
assert.ok(query.includes("?dataLicenseNode schema:author ?dataLicenseAuthorNode") && query.includes("?dataLicenseAuthorNode schema:name ?dataLicenseAuthorNameValue"), "sdLicense-Autorname wird aufgelöst");
assert.ok(query.includes("?dataLicenseNode schema:copyrightHolder ?dataLicenseCopyrightHolderNode") && query.includes("?dataLicenseCopyrightHolderNode schema:name ?dataLicenseCopyrightHolderNameValue"), "sdLicense-Rechteinhabername wird aufgelöst");
assert.ok(query.includes('GROUP_CONCAT(DISTINCT ?dataLicenseAuthorValue; separator=" · ") AS ?dataLicenseAuthors') && query.includes('GROUP_CONCAT(DISTINCT ?dataLicenseCopyrightHolderValue; separator=" · ") AS ?dataLicenseCopyrightHolders'), "alle unterschiedlichen sdLicense-Autor- und Rechteinhabernamen bleiben erhalten");
assert.ok(query.includes('GROUP_CONCAT(DISTINCT ?dataCreditValue; separator=" · ") AS ?dataCreditText') && query.includes('GROUP_CONCAT(DISTINCT ?dataCopyrightValue; separator=" · ") AS ?dataCopyrightNotice'), "Root-Credit- und Copyright-Belege werden ohne SAMPLE zusammengeführt");
assert.ok(query.includes("?s schema:sdPublisher ?sdPublisherNode") && query.includes("?sdPublisherNode schema:name ?sdPublisherNameValue"), "sdPublisher wird über den Organisationsnamen aufgelöst");
assert.ok(query.includes("?s schema:publisher ?publisherNode") && query.includes("?publisherNode schema:name ?publisherNameValue"), "publisher-Knoten wird über schema:name aufgelöst");
assert.ok(query.includes("?imgObj schema:creator ?imageCreatorNode") && query.includes("?imageCreatorNode schema:name ?imageCreatorNameValue"), "Bild-creator-Knoten wird über schema:name aufgelöst");
assert.ok(query.includes("?imgObj schema:copyrightHolder ?imageCopyrightHolderNode") && query.includes("?imageCopyrightHolderNode schema:name ?imageCopyrightHolderNameValue"), "Bild-copyrightHolder wird über schema:name aufgelöst");
assert.ok(query.includes("ENCODE_FOR_URI(STR(COALESCE(?imageCopyrightHolderResolved"), "copyrightHolder hat einen eigenen Recordslot statt als Creator ausgegeben zu werden");
assert.ok(query.includes("?s schema:creditText ?dataCreditValue") && query.includes("?s schema:copyrightNotice ?dataCopyrightValue"), "Root-Credit und -Copyright werden als eigene Textbelege abgefragt");
assert.ok(query.includes('(GROUP_CONCAT(DISTINCT ?imageRecord; separator="\\n") AS ?imageRecords)'), "Bildrecords werden außen am bereits geo-gebundenen ?s aggregiert");
assert.ok(!query.includes("SELECT ?s (GROUP_CONCAT") && !query.includes("SELECT ?s ?imgObj"), "es gibt keine globale oder per Bild verschachtelte Aggregations-Subquery");

const classifications = [
  [{ "schema:name": "Besenwirtschaft Krug", "schema:description": "Traditionelle Winzervesper" }, "besen"],
  [{ "schema:name": "Vinothek Vaihingen", "schema:description": "Weinverkauf und Verkostung" }, "vinothek"],
  [{ "schema:name": "Mayerhöfle", "schema:description": "Älteste Weinstube Tübingens" }, "weinstube"],
  [{ "schema:name": "Weingut Killmeyer", "schema:description": "Weinbau" }, "weingut"],
  [{ "schema:name": "Weinausschank Wengert Häusle", "schema:description": "Weine probieren" }, "weinstube"],
];
classifications.forEach(([place, category]) => {
  assert.ok(app.classifyWinery(place).includes(category), `${place["schema:name"]} wird als ${category} klassifiziert`);
});

const record = [
  "https://images.example.test/a.jpg",
  "https://creativecommons.org/licenses/by/4.0/",
  "Foto & Credit",
  "Winzerin Beispiel",
  "Bildrechte Verein",
  "© Beispiel",
  "https://example.test/quellen/foto-a",
].map(encodeURIComponent).join("|");
const poi = app.convertSparqlBindingToPoi({
  s: { value: "https://example.test/winery" },
  namePreferred: { value: "Winery", "xml:lang": "en" },
  dataLicense: { value: "https://creativecommons.org/licenses/by-nc-nd/4.0/legalcode.de" },
  sdPublisher: { value: "Reiseland Brandenburg" },
  dataCreditText: { value: "Credittext aus dem Wurzelknoten" },
  dataCopyrightNotice: { value: "Copyright aus dem Wurzelknoten" },
  dataLicenseAuthors: { value: "Autorin Eins · Autor Zwei" },
  dataLicenseCopyrightHolders: { value: "Rechteinhaber Eins · Rechteinhaber Zwei" },
  imageRecords: { value: record },
}, "en");
const image = poi["schema:image"];
assert.strictEqual(image["schema:contentUrl"], "https://images.example.test/a.jpg");
assert.strictEqual(image["schema:license"], "https://creativecommons.org/licenses/by/4.0/");
assert.strictEqual(image["schema:creditText"], "Foto & Credit");
assert.strictEqual(image["schema:creator"], "Winzerin Beispiel");
assert.strictEqual(image["schema:copyrightHolder"], "Bildrechte Verein", "Rechteinhaber wird nicht als Urheber umetikettiert");
assert.strictEqual(record.split("|").length, 7, "sieben getrennte Bildmetadaten im kodierten Record");
const holderOnlyRecord = ["https://images.example.test/holder.jpg", "https://creativecommons.org/licenses/by/4.0/", "", "", "Bildrechte Verein", "© Beispielstadt", ""].map(encodeURIComponent).join("|");
const holderOnly = app.convertSparqlBindingToPoi({ imageRecords: { value: holderOnlyRecord } });
assert.strictEqual(holderOnly["schema:image"]["schema:creator"], "");
assert.strictEqual(holderOnly["schema:image"]["schema:copyrightHolder"], "Bildrechte Verein");
const holderOnlyImage = app.normalizeDztPoi(holderOnly, 48, 9).images[0];
assert.ok(holderOnlyImage.copyright.includes("Rechteinhaber: Bildrechte Verein"));
assert.ok(!holderOnlyImage.copyright.includes("Urheber:"));
assert.ok(app.renderImageRightsMarkup(holderOnlyImage).includes("Bildnachweis:"));
assert.ok(!app.renderImageRightsMarkup(holderOnlyImage).includes("Urheberhinweis:"));
assert.strictEqual(image["schema:copyrightNotice"], "© Beispiel");
assert.strictEqual(image["schema:url"], "https://example.test/quellen/foto-a");
assert.strictEqual(poi["@context"].schema, "https://schema.org/", "SPARQL-POI trägt einen schema.org-Kontext für den JSON-LD-Export");
assert.strictEqual(poi["schema:license"], "https://creativecommons.org/licenses/by-nc-nd/4.0/legalcode.de", "sdLicense-Knotenlizenz wird als Datenlizenz konvertiert");
assert.strictEqual(poi["schema:publisher"], "Reiseland Brandenburg", "Herausgebername statt Organisations-IRI wird konvertiert");
assert.strictEqual(poi["schema:creditText"], "Credittext aus dem Wurzelknoten · Autor: Autorin Eins · Autor Zwei");
assert.strictEqual(poi["schema:copyrightNotice"], "Copyright aus dem Wurzelknoten · Rechteinhaber: Rechteinhaber Eins · Rechteinhaber Zwei");
const normalizedConvertedEvidence = app.normalizeDztPoi(poi, 48.5, 9.1);
assert.strictEqual(normalizedConvertedEvidence.dataLicense.attribution, "Reiseland Brandenburg");
assert.strictEqual(normalizedConvertedEvidence.creditText, "Credittext aus dem Wurzelknoten · Autor: Autorin Eins · Autor Zwei");
assert.strictEqual(normalizedConvertedEvidence.copyrightNotice, "Copyright aus dem Wurzelknoten · Rechteinhaber: Rechteinhaber Eins · Rechteinhaber Zwei");
const convertedDataRights = app.renderDataRights(normalizedConvertedEvidence);
assert.ok(convertedDataRights.includes("Autor: Autorin Eins · Autor Zwei") && convertedDataRights.includes("Rechteinhaber: Rechteinhaber Eins · Rechteinhaber Zwei"), "sdLicense-Autor und -Rechteinhaber erscheinen in den getrennten Credit- und Copyrightfeldern");
assert.ok(!convertedDataRights.includes("Herausgeber: Autorin") && !convertedDataRights.includes("Herausgeber: Rechteinhaber"), "sdLicense-Namen werden nicht als Publisher umetikettiert");

const localized = app.convertSparqlBindingToPoi({
  namePreferred: { value: "English", "xml:lang": "en" },
  nameDe: { value: "Deutsch", "xml:lang": "de" },
  nameNeutral: { value: "Neutral" },
  descPreferred: { value: "Description", "xml:lang": "en" },
  descDe: { value: "Beschreibung", "xml:lang": "de" },
}, "en");
assert.strictEqual(localized["schema:name"], "English");
assert.strictEqual(localized["schema:description"], "Description");
const localizedJsonLd = app.normalizeDztPoi({
  "schema:name": [{ "@value": "Deutsch", "@language": "de" }, { "@value": "English", "@language": "en" }],
  "schema:description": [{ "@value": "Beschreibung", "@language": "de" }, { "@value": "Description", "@language": "en" }],
}, 48.5, 9.1, "en");
assert.strictEqual(localizedJsonLd.name, "English");
assert.strictEqual(localizedJsonLd.description, "Description");
const linkedDescriptions = [
  { "@id": "https://example.test/description/de", "schema:text": { "@value": "Deutsche Weinbeschreibung", "@language": "de" } },
  { "@id": "https://example.test/description/en", "schema:text": { "@value": "English winery description", "@language": "en" } },
];
assert.strictEqual(app.normalizeDztPoi({ "schema:description": linkedDescriptions }, 48.5, 9.1, "en").description, "English winery description", "CreativeWork/text unterstützt die bevorzugte Sprache");
assert.strictEqual(app.normalizeDztPoi({ "schema:description": linkedDescriptions }, 48.5, 9.1, "fr").description, "Deutsche Weinbeschreibung", "CreativeWork/text behält den deutschen Sprachfallback");
const expandedDescription = app.normalizeDztPoi({
  "https://schema.org/description": { "@id": "https://example.test/description/expanded", "https://schema.org/text": { "@value": "Expanded JSON-LD description", "@language": "en" } },
}, 48.5, 9.1, "en");
assert.strictEqual(expandedDescription.description, "Expanded JSON-LD description", "direkte Normalize-Eingabe unterstützt erweitertes JSON-LD");
const unresolvedDescription = app.normalizeDztPoi({ "schema:description": { "@id": "https://onlim.example/entity/description" } }, 48.5, 9.1);
assert.strictEqual(unresolvedDescription.description, "", "Beschreibung gibt eine unaufgelöste CreativeWork-IRI nicht als Text aus");
const zeroPoi = app.convertSparqlBindingToPoi({ s: { value: "https://example.test/zero" }, lat: { value: "0" }, lng: { value: "0" } });
const normalizedZeroPoi = app.normalizeDztPoi(zeroPoi, 0, 0);
assert.strictEqual(normalizedZeroPoi.lat, 0, "JSON-LD/SPARQL-Koordinaten am Äquator werden nicht als fehlend interpretiert");
assert.strictEqual(normalizedZeroPoi.lng, 0);
assert.strictEqual(app.validCoordinates(0, 0), true, "beide Nullkoordinaten sind eine gültige Kartenposition");

const normalized = app.normalizeDztPoi({
  "@id": "winery-rights",
  "schema:name": "Rechte Weingut",
  "schema:geo": { "schema:latitude": 48.5, "schema:longitude": 9.1 },
  "schema:license": "https://example.test/data-license",
  "schema:publisher": "Kommune Beispiel",
  "schema:image": [
    {
      "schema:contentUrl": "https://images.example.test/permitted.jpg",
      "schema:license": "https://creativecommons.org/licenses/by/4.0/",
      "schema:creditText": "Fotografie Beispiel",
      "schema:url": "https://example.test/source/permitted",
    },
    { "schema:contentUrl": "https://images.example.test/no-license.jpg" },
    {
      "schema:contentUrl": "javascript:alert(1)",
      "schema:license": "https://creativecommons.org/publicdomain/zero/1.0/",
    },
    {
      "schema:contentUrl": "https://images.example.test/no-credit.jpg",
      "schema:license": "https://creativecommons.org/licenses/by-sa/4.0/",
      "schema:url": "https://example.test/source/no-credit",
    },
  ],
}, 48.5, 9.1);
assert.strictEqual(normalized.dataLicense.url, "https://example.test/data-license");
assert.strictEqual(normalized.dataLicense.attribution, "Kommune Beispiel");
const unresolvedPublisher = app.normalizeDztPoi({
  "schema:sdPublisher": { "@id": "https://example.test/organization/123" },
}, 48.5, 9.1);
assert.strictEqual(unresolvedPublisher.dataLicense.attribution, "", "unaufgelöste Publisher-IRIs werden nicht als Herausgebertext ausgegeben");
assert.deepStrictEqual(Array.from(normalized.images, (item) => item.url), ["https://images.example.test/permitted.jpg"]);
const relativeImage = app.normalizeDztPoi({
  "@id": "relative-image",
  "schema:name": "Relative Quelle",
  "schema:image": { "schema:contentUrl": "assets/demo-weingueter.svg", "schema:license": "https://opensource.org/license/mit", "schema:copyrightNotice": "Ondics GmbH" },
}, 48.5, 9.1);
assert.strictEqual(relativeImage.imageUrl, "", "relative Bild-URLs werden außerhalb des lokalen Demoloaders verworfen");
assert.strictEqual(normalized.imageLicense, "https://creativecommons.org/licenses/by/4.0/");
assert.strictEqual(normalized.imageCopyright, "Fotografie Beispiel");
const dataRights = app.renderDataRights(normalized);
assert.ok(dataRights.includes("Datenlizenz") && dataRights.includes("Herausgeber"), "Datenrechte werden separat ausgewiesen");
assert.ok(dataRights.includes("Kommune Beispiel") && dataRights.includes("https://example.test/data-license"));
assert.ok(!dataRights.includes("Fotografie Beispiel"), "Bildrechte werden nicht mit Datenrechten vermischt");
const imageRights = app.renderImageRightsMarkup(normalized.images[0]);
assert.ok(imageRights.includes("Bildlizenz") && imageRights.includes("CC BY 4.0"));
assert.ok(imageRights.includes("Fotografie Beispiel") && imageRights.includes("https://example.test/source/permitted"));
assert.ok(!app.renderImageRightsMarkup({ url: "https://image.example.test/a.jpg", license: "javascript:alert(1)", copyright: "DZT" }).includes("href=\"javascript:"), "unsichere Lizenzziele werden nicht verlinkt");
assert.ok(!app.renderImageRightsMarkup({ url: "https://image.example.test/a.jpg", license: "https://creativecommons.org/licenses/by/4.0/", copyright: "" }).includes("DZT"), "Bildrechte erfinden keine DZT-Attribution");
const byWithoutSeparateSource = app.normalizeDztPoi({
  "schema:name": "Foto ohne Quellseite",
  "schema:image": { "schema:contentUrl": "https://images.example.test/by-without-page.jpg", "schema:license": "https://creativecommons.org/licenses/by/4.0/", "schema:creator": { "schema:name": "Fotografin Beispiel" } },
}, 48.5, 9.1);
assert.strictEqual(byWithoutSeparateSource.images.length, 1, "CC-BY-Bild mit nachgewiesenem Creator bleibt ohne zusätzliches schema:url sichtbar");
assert.strictEqual(byWithoutSeparateSource.images[0].sourceUrl, "https://images.example.test/by-without-page.jpg", "contentUrl dient als sichere Quellenfallback-URL");
const byNcNdPhoto = app.normalizeDztPoi({
  "schema:name": "Dokumentierte DZT-Lizenz",
  "schema:image": { "schema:contentUrl": "https://images.example.test/by-nc-nd.jpg", "schema:license": "https://creativecommons.org/licenses/by-nc-nd/4.0/legalcode.de", "schema:creator": { "schema:name": "Fotograf DZT" }, "schema:url": "https://example.test/dzt-photo" },
}, 48.5, 9.1);
assert.strictEqual(byNcNdPhoto.images.length, 1, "dokumentierter offizieller CC BY-NC-ND-Fall bleibt mit Urheber- und Quellenbeleg sichtbar");
const creatorIriOnly = app.normalizeDztPoi({
  "schema:name": "Foto ohne benannten Urheber",
  "schema:image": { "schema:contentUrl": "https://images.example.test/no-creator-name.jpg", "schema:license": "https://creativecommons.org/licenses/by/4.0/", "schema:creator": { "@id": "https://example.test/person/123" }, "schema:url": "https://example.test/photo-page" },
}, 48.5, 9.1);
assert.strictEqual(creatorIriOnly.images.length, 0, "Creator-IRI ohne aufgelösten Namen zählt nicht als CC-BY-Attribution");
const expandedHolderImage = app.normalizeDztPoi({
  "https://schema.org/image": {
    "https://schema.org/contentUrl": { "@value": "https://images.example.test/expanded-holder.jpg" },
    "https://schema.org/license": { "@value": "https://creativecommons.org/licenses/by-sa/4.0/" },
    "https://schema.org/creator": { "@id": "https://example.test/person/creator", "https://schema.org/name": "Fotografin Beispiel" },
    "https://schema.org/copyrightHolder": { "@id": "https://example.test/org/holder", "https://schema.org/name": "Bildrechte Verein" },
    "https://schema.org/copyrightNotice": { "@value": "© Beispielstadt" },
  },
}, 48.5, 9.1);
assert.strictEqual(expandedHolderImage.images.length, 1, "erweitertes JSON-LD mit benanntem copyrightHolder bleibt nutzbar");
assert.ok(expandedHolderImage.images[0].copyright.includes("Fotografin Beispiel") && expandedHolderImage.images[0].copyright.includes("Bildrechte Verein") && expandedHolderImage.images[0].copyright.includes("© Beispielstadt"), "direkte Normalize-Eingabe bewahrt Creator, copyrightHolder und notice");
assert.ok(!expandedHolderImage.images[0].copyright.includes("example.test"), "unaufgelöste Bildrechte-IRIs werden nicht als Namen angezeigt");
const gastroEvidenceRecord = ["https://images.example.test/gastro.jpg", "", "DZT-Fotohinweis", "", "", "", ""].map(encodeURIComponent).join("|");
const gastroEvidence = app.convertSparqlBindingToPoi({
  s: { value: "https://example.test/gastro" },
  dataLicense: { value: "https://creativecommons.org/licenses/by-nc-nd/4.0/legalcode.de" },
  sdPublisher: { value: "Reiseland Brandenburg" },
  dataCreditText: { value: "Credittext aus dem Wurzelknoten" },
  dataCopyrightNotice: { value: "Copyright aus dem Wurzelknoten" },
  imageRecords: { value: gastroEvidenceRecord },
});
const rootRightsDoNotLicensePhoto = app.normalizeDztPoi(gastroEvidence, 48.5, 9.1);
assert.strictEqual(rootRightsDoNotLicensePhoto.images.length, 0, "Dataset-Lizenz und Root-Credits übertragen keine Bildrechte");
const modal = { innerHTML: "" };
const modalContent = { innerHTML: "" };
app.document.getElementById = (id) => id === "sw_detail-detail-modal" ? modal : id === "sw_detail-detail-modal-content" ? modalContent : null;
app.openDetailModal({ uid: "sw_detail", ort: "Vaihingen", allPois: [normalized] }, normalized.id);
assert.ok(modalContent.innerHTML.includes("Datenrechte") && modalContent.innerHTML.includes("Bildrechte"), "Detail-Modal zeigt Daten- und Bildrechte getrennt");

console.log("✅ test_winery_logic: echte Runtime-Funktionen für Query, Sprache, Klassifikation und Rechte");
