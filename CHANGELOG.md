# Changelog – Weingüter & Weingenuss

Alle wichtigen Änderungen an dieser Open Data App werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/) und diese App folgt [Semantic Versioning](https://semver.org/lang/de/).

## 1.0.5 - 2026-10-08
- DOC: Screenshot-Metadaten um drei aktuelle Desktop- und drei Mobile-Screenshots ergänzt; kein Laufzeitverhalten geändert.

## 1.0.4 - 2026-10-08
- FIX: Optionalen Branding-CSS-Dateilink im Paket und lokalen Konfigurationsspiegel standardmäßig leer lassen; der relative Paketpfad blockierte das Speichern im URL-Feld des ODAS-Editors.
- TEST: Regression für nicht speicherbare relative CSS-Dateilink-Vorbelegungen ergänzt.

## 1.0.3 - 2026-10-08
- FIX: Kein Demo-Fallback nach produktiven DZT-Fehlern; lokale synthetische Fixtures sind sichtbar gekennzeichnet und unter `/app/` erreichbar.
- FIX: Fehlende Quelle, ungültige Antwort und nicht auflösbarer Ort werden nicht als gültiges Ergebnis oder Ersatzregion behandelt.
- FIX: Objektbezogene Daten- und Bildnachweise durch den SPARQL-, Normalisierungs- und Darstellungsweg erhalten; Urheber und Rechteinhaber bleiben getrennte Rollen.
- FIX: Verschachtelte Beschreibungstexte gelesen und die generierte Abfrage verlustfrei für die GET-Längengrenze des Relays verkürzt (HTTP-414-Regression).
- FIX: Mobiler Demo-/Fehlerhinweis verdeckt nicht mehr die Kennzahlen.
- FIX: Alle geladenen Weinorte im Katalog erreichbar; Tastaturbedienung, Sprachwahl und Schale-4-Felder verdrahtet.
- TEST: Tests führen die produktive Runtime statt Funktionskopien aus; Regressionen für Fehler- und Rechtepfade ergänzt.
- DOC: Datenmodell, README, Datenschutz, richtige Store-Screenshots und Lizenznachweise synchronisiert; eigener Code unter MIT.
- BUILD: Ungenutztes Chart.js entfernt; eigenständiges `make test` und frische ZIPs einschließlich Lizenztext.

## 1.0.2 - 2026-10-02
- ENH: Verwendete ODAS-Dienste in `odas-services` deklariert.

## 1.0.1 - 2026-09-29

### Behoben
- **XSS über Inline-JavaScript geschlossen (Audit F-149):**
  - POI-IDs werden nicht mehr in `onclick`-Attributen eingesetzt; stattdessen HTML-escapade `data-sw-action`-/`data-sw-poi-id`-Attribute mit delegiertem Klick-Handler (`registerSwActionHandler`).
- **Nur http(s)-Linkziele in Detail-Schnellkontakten (Audit-Fix, Portfolio-Muster `safeHttpUrl`):**
  - `poi.url` und `poi.hasMenu` werden vor der `href`-Verwendung auf `http(s)` validiert; ungültige Werte erscheinen als Text statt als klickbarer Link (`javascript:`-/`data:`-Schemata sind damit als Linkziel ausgeschlossen).
- **Kopier-Button „In Zwischenablage kopieren" repariert (Audit F-150):**
  - Nutzt `data-sw-copy` statt `JSON.stringify` im `onclick`-Attribut; das Attribut brach zuvor an den JSON-Anführungszeichen (Syntaxfehler „Unexpected end of input", nichts wurde kopiert).
  - Neue Regressionstests: `tests/test_xss_regression.js`.

## [1.0.0] - 2026-09-24

### Hinzugefügt
- **Initiale Erstellung der Open Data App „Weingüter & Weingenuss“ (`oda-weingueter`):**
  - Dedizierte DZT Knowledge Graph SPARQL-Abfrage für `https://schema.org/Winery`.
  - Intelligente Klassifikations-Engine für Winzererlebnisse: *Weingüter*, *Vinotheken*, *Besen- & Straußwirtschaften*, *Weinstuben* sowie *Weinproben/Führungen*.
  - Cockpit mit 4-KPI-Kacheln (Schale 4): Gesamtanzahl, Winzer, Besenwirtschaften, Vinotheken.
  - 6 Filter-Pills mit dynamischen Live-Zählern und farbcodierten Weinthemen.
  - Detail-Modal mit Schnellkontakt (Telefon, Website, Speise-/Weinkarte) und externer Routenführung.
  - Vollbild-Katalogmodus (Fotogalerie) mit Zoom- und Direktabsprung auf die Karte.
  - Randlose Leaflet-Karte mit Markerclustering und Vektor-SVG-Pins in Burgunder- und Naturtönen.
  - Normgerechtes ODAS SVG-Icon mit Trauben, Weinblatt und stilisiertem Weinglas.
  - Lokales Datenfixture `assets/demo-weingueter.json` mit 12 authentischen Einträgen aus TouBiz und DZT.
  - Vollständige Suite automatisierter Tests für Metadaten, Fixture, Geocoding und Klassifikationslogik.
