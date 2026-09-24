const assert = require('assert');

function buildDztSparqlQuery(lat, lng, radiusKm) {
  const numLat = parseFloat(lat);
  const numLng = parseFloat(lng);
  const radius = parseFloat(radiusKm) || 25;
  const geoShapeJson = JSON.stringify({
    query: {
      geo_shape: {
        geometry: {
          shape: { type: "circle", radius: `${radius}km`, coordinates: [numLng, numLat] },
          relation: "intersects"
        }
      }
    }
  });

  return `PREFIX inst: <http://www.ontotext.com/connectors/elasticsearch/instance#>
PREFIX con: <http://www.ontotext.com/connectors/elasticsearch#>
PREFIX schema: <https://schema.org/>

SELECT ?s 
  (SAMPLE(?nameDe) AS ?name)
  (SAMPLE(?descDe) AS ?desc)
  (SAMPLE(?latVal) AS ?lat)
  (SAMPLE(?lngVal) AS ?lng)
  (SAMPLE(?streetVal) AS ?street)
  (SAMPLE(?postalVal) AS ?postal)
  (SAMPLE(?cityVal) AS ?city)
  (SAMPLE(?freeVal) AS ?free)
  (SAMPLE(?telVal) AS ?telephone)
  (SAMPLE(?urlVal) AS ?url)
  (SAMPLE(?menuVal) AS ?hasMenu)
  (SAMPLE(?imgUrl) AS ?img)
  (GROUP_CONCAT(DISTINCT ?imgUrl; separator="|") AS ?imgs)
  (GROUP_CONCAT(DISTINCT ?type; separator=",") AS ?types)
WHERE {
  ?search a inst:dzt-geo-shapes ;
    con:query ${JSON.stringify(geoShapeJson)} ;
    con:entities ?s .
  
  ?s a schema:Winery .
  OPTIONAL { ?s a ?type }
  ?s schema:name ?nameDe .
  FILTER(lang(?nameDe) = "de" || lang(?nameDe) = "")
  OPTIONAL {
    ?s schema:description ?descDe .
    FILTER(lang(?descDe) = "de" || lang(?descDe) = "")
  }
  OPTIONAL {
    ?s schema:geo ?geo .
    ?geo schema:latitude ?latVal .
    ?geo schema:longitude ?lngVal .
  }
  OPTIONAL {
    ?s schema:address ?addr .
    OPTIONAL { ?addr schema:streetAddress ?streetVal }
    OPTIONAL { ?addr schema:postalCode ?postalVal }
    OPTIONAL { ?addr schema:addressLocality ?cityVal }
  }
  OPTIONAL { ?s schema:telephone ?telVal }
  OPTIONAL { ?s schema:url ?urlVal }
  OPTIONAL { ?s schema:hasMenu ?menuVal }
  OPTIONAL { ?s schema:isAccessibleForFree ?freeVal }
  OPTIONAL {
    ?s schema:image ?imgObj .
    ?imgObj schema:contentUrl ?imgUrl .
  }
}
GROUP BY ?s
LIMIT 300`;
}

function classifyWinery(item) {
  if (!item) return ['weingut'];
  const name = String(item['schema:name'] || item.name || '').toLowerCase();
  const desc = String(item['schema:description'] || item.desc || item.description || '').toLowerCase();
  const text = `${name} ${desc}`;
  const types = [];

  if (/besen|strau[ßs]|hecke|besenwirtschaft|wengert h[äa]usle|besenkultur/.test(text)) {
    types.push('besen');
  }
  if (/vinothek|weinverkauf|weinhandlung|wein- und sektverkauf/.test(text)) {
    types.push('vinothek');
  }
  if (/weinstube|ausschank|gastst[äa]tte|sch[äa]nke|k[üu]fer/.test(text)) {
    types.push('weinstube');
  }
  if (/weinprobe|verkostung|tasting|degustation|kellerf[üu]hrung/.test(text)) {
    types.push('probe');
  }
  if (/weingut|winzer|kellerei|weing[äa]rtner|rebland|weinbau/.test(text) || types.length === 0) {
    types.push('weingut');
  }

  return types;
}

// 1. Tests für SPARQL Query
const query = buildDztSparqlQuery(48.9328, 8.9564, 25);
assert.ok(query.includes('schema:Winery'), 'SPARQL muss schema:Winery selektieren');
assert.ok(!query.includes('schema:TouristAttraction'), 'SPARQL darf keine fremden Typen wie TouristAttraction selektieren');
assert.ok(!query.includes('schema:Museum'), 'SPARQL darf keine fremden Typen wie Museum selektieren');
assert.ok(query.includes('schema:telephone'), 'SPARQL muss telephone selektieren');
assert.ok(query.includes('schema:hasMenu'), 'SPARQL muss hasMenu selektieren');

// 2. Tests für Klassifizierung
const tBesen = classifyWinery({ 'schema:name': 'Besenwirtschaft Krug', 'schema:description': 'Traditionelle Winzervesper' });
assert.ok(tBesen.includes('besen'), 'Besenwirtschaft muss erkannt werden');

const tVinothek = classifyWinery({ 'schema:name': 'Vinothek Vaihingen', 'schema:description': 'Großer Weinverkauf und Verkostung' });
assert.ok(tVinothek.includes('vinothek'), 'Vinothek muss erkannt werden');
assert.ok(tVinothek.includes('probe'), 'Verkostung muss als Weinprobe erkannt werden');

const tWeinstube = classifyWinery({ 'schema:name': 'Mayerhöfle', 'schema:description': 'Älteste Weinstube Tübingens' });
assert.ok(tWeinstube.includes('weinstube'), 'Weinstube muss erkannt werden');

const tWeingut = classifyWinery({ 'schema:name': 'Weingut Killmeyer', 'schema:description': 'Qualitäts- und Prädikatweine aus eigenem Anbau' });
assert.ok(tWeingut.includes('weingut'), 'Weingut muss erkannt werden');

const tAusschank = classifyWinery({ 'schema:name': 'Weinausschank Wengert Häusle', 'schema:description': 'Weine probieren am Weinberg' });
assert.ok(tAusschank.includes('besen') || tAusschank.includes('weinstube'), 'Wengert Häusle muss als Ausschank/Besen erkannt werden');

console.log('Task 4 Test: SPARQL query & winery classification passed.');

module.exports = { buildDztSparqlQuery, classifyWinery };
