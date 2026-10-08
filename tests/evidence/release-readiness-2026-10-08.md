# Verifikation Weingüter 1.0.3

Prüfdatum: **2026-10-08**. Umgebung: Node.js 26.10.0, Python 3.14.8, Google Chrome 153.0.8010.52, VS-Code-Live-Server. Die gemeinsamen `app-base.*`, `index.html` und Containerdateien wurden nicht verändert.

Die Browsermatrix verwendet kontrollierte synthetische Antworten, den echten App-Code, native Klick-/Tastaturereignisse und ein nachgebildetes flaches ODAS-Auslieferungslayout. Sie ist **keine Portalabnahme**. Die unten gesondert genannten authentifizierten DZT-Abfragen sind read-only Design-Time-Tests; der Schlüssel lag nie im Browser oder Repository.

## Automatisierte Tests

- `PYTHONDONTWRITEBYTECODE=1 make test`: 9/9 Node-Testdateien einschließlich vorbestehender XSS-Regression, 1/1 Test der tatsächlichen ZIP-Rezeptur; Syntax und JSON erfolgreich.
- Portfolio-Konfigurationslint ohne Befund. Docker-Compose-Basiskonfiguration und Kombination mit Standalone-Override syntaktisch validiert; kein Docker-Image-Build.
- Echte Runtime-Funktionen statt kopierter Implementierungen. Neue Fehler-, Koordinaten-, Konfigurations-, Rechte- und Transportregressionen zunächst rot, danach grün.

## Browsermatrix: 13/13 erfolgreich

1. Localhost lädt ausschließlich die zwölf gekennzeichneten synthetischen Weinorte; keine DZT-Anfrage, keine lokalen Asset-404.
2. Flache ODAS-Basis: Daten-/Bildrechte, JSON-LD, Details, Katalog per Enter und Seitennavigation ohne doppelte Karte.
3.–7. Fehlende Quelle ohne Fetch, gültig leer, ungültiges HTTP-200-Format, HTTP 500 und nicht auflösbarer Ort ohne erfundenen Ersatzort/Demo-Fallback.
8. Alle 75 gelieferten Testbetriebe sind im Katalog erreichbar.
9. Redaktioneller Datenstand escaped und weiterführender Link in Schale 4 sichtbar.
10.–13. 320, 390, 768 und 1440 px ohne horizontale Überbreite. Mobile Demo-/Fehlerhinweise verdecken die Kennzahlen nicht; nach Ende der Animationen geometrisch geprüft.

Die neuen Storebilder zeigen eigene synthetische Daten/Illustration, keine fremden Betriebsfotos und keine behauptete Portalabnahme.

## Aktueller DZT-Vertrag und GET-Länge

Die tatsächliche Runtime-Abfrage wurde für Vaihingen an der Enz / 5 km read-only ausgeführt: **HTTP 200, 7 Weinorte, 20 belegte Bilder, 7 Beschreibungen**, keine Beschreibungs-IRIs statt Text und keine ungültigen Entfernungen.

Die zunächst erweiterte Abfrage überschritt die GET-Grenze (HTTP 414; Relay-URI rund 13.430 Zeichen). Die Runtime verkürzt ausschließlich ihre eigene generierte SPARQL-Abfrage, schützt Literale/IRIs und bewahrt alle Ergebnis-Aliasnamen. Der finale Relaypfad dieses Tests hat **6.770 Zeichen**; Tests prüfen Reserve unter 8 KiB auch bei langen Koordinaten. Weder Backendwechsel noch Frontend-Schlüssel oder N+1-Abfragen wurden eingeführt.

Sieben URI-kodierte Bildfelder bewahren URL, Lizenz, Credit, Creator, Rechteinhaber, Copyright-Hinweis und Quelle getrennt. Ein benannter Rechteinhaber wird im JSON-LD ausdrücklich **nicht** zum Creator erklärt. Unaufgelöste IRIs reichen nicht als Namensnachweis. Quelle, Datenautor und Datenrechteinhaber bleiben von Bildrechten getrennt.

## Grenzen

Keine neue ODAS-Instanz gebucht/verändert, kein GitHub-Push. `schema:Winery`, die genehmigten Textheuristiken und das offengelegte Limit 300 bleiben erhalten. Historische reale Demos/Fotos in Git sind nicht durch die neue MIT-Demo nachlizenziert; Veröffentlichung mit Historie erfordert eine separate Rechteklärung.
