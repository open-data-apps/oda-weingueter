# Changelog – Weingüter & Weingenuss

Alle wichtigen Änderungen an dieser Open Data App werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/) und diese App folgt [Semantic Versioning](https://semver.org/lang/de/).

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
