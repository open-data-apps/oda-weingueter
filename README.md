Die App **Weingüter & Weingenuss** macht Winzerhöfe, Weingüter, Vinotheken, Besen- und Straußwirtschaften sowie Weinstuben aus dem Knowledge Graph der Deutschen Zentrale für Tourismus (DZT) auf einer randlosen interaktiven Karte und in einer filterbaren Übersicht entdeckbar.

Die App ist für die Verwendung im [Open Data App Store](https://open-data-app-store.de/) gemacht und entspricht der [Open Data App Spezifikation](https://open-data-apps.github.io/open-data-app-docs/open-data-app-spezifikation/).

Mehr zu Open Data Apps unter https://github.com/open-data-apps

---

## Funktionen

Die App ist eine Single Page Application (Webapp) mit:

- Logo-Anzeige und Navigation
- Seiten für Impressum, Datenschutz, Beschreibung, Kontakt und Hauptinhalt
- Inhaltsbereich und Fußzeile

Die Konfiguration wird vom ODAS geladen. Die App bietet folgende Kernfunktionen:

- **Randlose Vollbild-Kartenansicht (100vw × 100vh)**: Interaktive Leaflet-Karte mit OpenStreetMap-Kacheln, performantem Marker-Clustering (`Leaflet.markercluster`) und zentrierten, gestochen scharfen Vektor-SVG-Pins in Burgunder- und Weinfarben.
- **Karten-Reset (Home-Button)**: Eigener Home-Button direkt über den Zoom-Tasten zum sofortigen Zurücksetzen auf die Ausgangsposition und den Startzoom.
- **Einklappbares Cockpit & Rand-Lasche (Desktop)**: Schlankes linkes Cockpit mit Live-Suche, Filter-Pills mit dynamischen Trefferzahlen und Schnellzugriff auf Details; einklappbar für ungestörte Kartensicht.
- **4-KPI-Cockpit**: Schneller Überblick über Gesamtzahl der Weinorte, aktive Weingüter, Besenwirtschaften sowie Vinotheken & Weinstuben.
- **Thematische Weingenuss-Filter**:
  - 🍷 **Alle**: Vollständige Übersicht aller Weinorte im Umkreis
  - 🍇 **Weingüter**: Winzerhöfe, Weingüter und genossenschaftliche Keltern
  - 🍾 **Vinotheken**: Stilvolle Weinverkäufe und Probierstuben
  - 🌿 **Besen**: Saisonale Besen-, Strauß- und Heckenwirtschaften
  - 🏮 **Weinstuben**: Traditionelle Weinstuben und Weinausschank
  - 🥂 **Weinproben**: Angebote mit Führungen und Verkostungen
- **Vollbild Foto-Katalog**: Umschaltbare Bildergalerie aller Weinorte mit großformatigen Bildern, Entfernungsangaben und Direktabsprung auf die Karte.
- **Detailansicht (Modal) & Vollbild-Lightbox**:
  - Strukturierte Details mit Adresse, Kontaktdaten (Telefon, Website, Speise-/Weinkarte) und Lizenzen.
  - Klickbare Vollbild-Bildergalerie mit Touch-Wischgesten (Swipe), sanfter Richtungsanimation und Tastaturnavigation für Mehrfachbilder.
- **Mobiles Bedienkonzept (Smartphones)**:
  - Schwebender Ansichtswechsler (`🍷 Weinorte (12)` / `🗺️ Karte`) zum einfachen Umschalten zwischen Vollbild-Karte und Trefferliste.
  - Kompaktes Erlebnis-Dropdown neben der Sortierung (kein horizontales Scrollen/Quetschen).
  - Bündiger Seitenkopf ohne Element-Überlappung.
- **Dynamischer QR-Code**: Schnelle Übertragung der aktuellen App-Ansicht auf Smartphones über einen dynamisch erzeugten QR-Code.
- **Performance & Session-Cache**: Sitzungsbasierte Zwischenspeicherung im Browser (`sessionStorage`) für blitzschnelle Ladezeiten und nahtlose Unterseiten-Wechsel.
- **ODTA-konformer JSON-LD-Export**: Rohdaten anzeigen, kopieren oder als `.jsonld`-Datei herunterladen.
- **Schale-4-Komponenten**: Bürgerfreundlicher Methodik-Kasten, Erläuterungstexte und dreistufige Datenquellen-Verlinkung.

---

## Für wen ist diese App?

Diese App richtet sich an Weinliebhaber, Bürgerinnen, Bürger, Urlaubsgäste und Ausflügler, die Weingüter, Vinotheken und saisonale Besenwirtschaften in ihrer Region erkunden möchten – für Weinproben, Weineinkauf ab Hof oder gesellige Einkehr. Zudem dient sie Kommunen und Weinregionen zur einfachen, ansprechenden Präsentation ihrer offenen DZT-Tourismusdaten.

Es sind keine besonderen Datenkenntnisse nötig – die Bedienung erfolgt intuitiv über Karte, Liste, Katalog und Filter.

---

## Datenformat

Die App lädt schema.org- und ODTA-konforme Daten aus dem **DZT Knowledge Graph**:

- **Typ:** `schema:Winery`
- **Attribute:** `name`, `description`, `geo` (GeoCoordinates), `address` (PostalAddress), `telephone`, `url`, `hasMenu`, `image` (ImageObject-Array mit Lizenzen).
- **Datenzugriff:** Im ODAS-Livebetrieb ausschließlich über den internen Store-Relay (`/dzt?path=...`). Der DZT-API-Key verbleibt sicher im Store.
- **Lokale Entwicklung:** Automatische Verwendung einer realistischen Fixture (`assets/demo-weingueter.json`).

---

## Kompatible Datensätze

| Datensatz | Quelle | Lizenz |
| --- | --- | --- |
| DZT Knowledge Graph (schema:Winery) | Deutsche Zentrale für Tourismus (DZT) | CC BY / CC BY-SA / CC0 |
| OpenStreetMap-Kacheln | OpenStreetMap contributors | ODbL |

---

## Systemvoraussetzungen

- Docker / Docker Compose
- Make

Die Entwicklung wurde getestet unter Linux und macOS.

### Starten

```bash
make build up
```

Die App ist anschließend lokal unter Port 8090 erreichbar:
http://localhost:8090

### Lokale Entwicklung mit VS Code Live Server

Alternativ kann die App mit VS Code Live Server aus der Projektwurzel gestartet werden. Öffne dann:
`http://127.0.0.1:5500/app/` (oder Port `5501` je nach Einstellung).

Die App erkennt Localhost automatisch und lädt `../odas-config/config.json`. Template-Dateien (`app/app-base.js`) müssen dafür nicht verändert werden.

---

## Konfiguration (Instanz)

Folgende Parameter werden bei der App-Instanzierung im ODAS konfiguriert:

| Parameter | Beschreibung | Kategorie | Erforderlich |
| --- | --- | --- | --- |
| `titel` | Hauptüberschrift der App | allgemein | ja |
| `seitentitel` | Browser-Tab-Titel | allgemein | ja |
| `icon` | App-Icon | allgemein | ja |
| `bannerTitel` | Titel im schwebenden Top-Banner | allgemein | nein |
| `bannerUntertitel` | Untertitel im schwebenden Top-Banner | allgemein | nein |
| `ort` | Gemeindename / Regionsbezeichnung (dient auch zur autom. Koordinaten-Ermittlung) | sonstiges | ja |
| `latitude` | Geografischer Breitengrad (optional, autom. Geocoding via `ort`) | sonstiges | nein |
| `longitude` | Geografischer Längengrad (optional, autom. Geocoding via `ort`) | sonstiges | nein |
| `radiusKm` | Suchradius in km (5, 10, 25, 50, 100) | sonstiges | ja |
| `standardFilter` | Initial aktiver Themenfilter | sonstiges | ja |
| `apiurls` | Datenquellen (SPARQL-Ressource) | datenherkunft | ja |
| `urlDaten` | Verlinkung zur Datensatz-Seite | datenherkunft | ja |
| `proxyAktiv` | ODAS-Proxy aktivieren (ja/nein) | datenherkunft | ja |
| `beschreibung` | Ausführliche Beschreibung / Methodik | beschreibung | ja |
| `impressum` | Impressum | kontakt-rechtliches | ja |
| `datenschutz` | Datenschutzerklärung | kontakt-rechtliches | ja |
| `kontakt` | Kontakthinweise | kontakt-rechtliches | ja |
| `fusszeile` | Fußzeilen-Text | kontakt-rechtliches | ja |

---

## Beim Aufruf kontaktierte Drittanbieter

Beim Aufruf dieser App werden keine externen Server für Programmbibliotheken kontaktiert; alle Bibliotheken (Bootstrap, Leaflet, MarkerCluster, QRCode) werden lokal aus `app/vendor/` ausgeliefert.

Extern abgerufen werden ausschließlich:
- Die konfigurierte Datenquelle des DZT Knowledge Graph über den internen ODAS-Store-Relay (`/dzt`).
- Die OpenStreetMap-Kartenkacheln: `tile.openstreetmap.org` (OpenStreetMap contributors, ODbL).
- Bei unvollständigen Koordinaten und unbekanntem Ort im Offline-Verzeichnis: Asynchrones Geocoding via OSM Nominatim (`nominatim.openstreetmap.org`).

Externe Routenplaner-Links (z. B. Google Maps) werden erst bei ausdrücklichem Benutzerklick in einem neuen Tab geöffnet.

---

## Wichtige Dateien

| Datei | Beschreibung |
| --- | --- |
| `app/app.js` | App-Logik: DZT SPARQL-Abruf (`schema:Winery`), 3-Stufen-Geocoding, Klassifikations-Engine, Leaflet-Karte, Clustering, Cockpit, Filter, Katalog, Lightbox, QR-Code |
| `app/app.css` | Vollbild-Layout, Weinthema, Glassmorphism-Cockpit, Vektor-Pins, Lightbox-Animationen, Mobile Queries |
| `app-package.json` | ODAS-Paketmetadaten und Instanzkonfiguration mit v1-kompatiblen Typen und Categories |
| `assets/gemeinden.json` | Integriertes Offline-Gemeindeverzeichnis für sofortiges Geocoding ohne externen Request |
| `assets/demo-weingueter.json` | Lokales Demo-Fixture mit 12 authentischen Weingütern für Offline-Entwicklung |
| `assets/schema.json` | Frictionless Table Schema des normalisierten Weingüter-Datenmodells |
| `assets/odas-app-icon.svg` | Normgerechtes ODAS SVG-App-Icon (512×512, Weinrot-Gradient, Trauben, Glas) |
| `odas-config/config.json` | Lokale Test-Konfiguration |
| `tests/` | Unit- und Integrations-Tests für Geocoding, Klassifikation, Metadaten und Demo-Daten |

---

## Autor

© 2026, Ondics GmbH
