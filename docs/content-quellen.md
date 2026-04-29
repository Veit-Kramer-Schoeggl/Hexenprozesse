# Content-Quellen

Diese Datei listet auf, **wo** der Inhalt für jede Seite ursprünglich liegt.
Die Quellen sind außerhalb des Repos unter
`~/Desktop/Papa/Hexenprozesse/01_Archiv/` zu finden.

## Verfügbare HTML-Quellsicherungen

### `01_Archiv/PHPsicherung/` (Live-Site-Sicherung 2011-03-21)

Saubere statische Sicherung der damals live gehosteten Site `hexenprozesse.at`.
**Beste Basis** für die Migration.

| Datei                | Inhalt                              | Ziel-Seite                          |
|----------------------|-------------------------------------|-------------------------------------|
| `index.html`         | Startseite mit Übersicht            | `src/index.html` (neu geschrieben)  |
| `kontakt.htm`        | Kontakt + Impressum                 | `src/pages/kontakt.html`            |
| `zechner1.htm`       | Stefan Zechner — Teil 1             | `src/pages/prozesse/zechner.html`   |
| `zechner2.htm`       | Stefan Zechner — Teil 2             | `src/pages/prozesse/zechner.html`   |
| `zechnerh.htm`       | Stefan Zechner — Hauptseite         | `src/pages/prozesse/zechner.html`   |

Die `*-Dateien/`-Ordner enthalten die zugehörigen Bilder/Hilfsdateien — beim
Migrieren in `src/assets/images/<slug>/` legen.

### `01_Archiv/X-Juli-2012/` (Arbeitsstand Juli 2012)

Spätere Variante, enthält zusätzliche Prozesse:

| Datei              | Prozess                            |
|--------------------|------------------------------------|
| `byloff1.html`     | Byloff (Forscher-Profil)           |
| `freyenthurn.html` | Freyenthurn                        |
| `hoerk2.html`      | Hörk                               |
| `lipp.html`        | Lipp                               |
| `neubauer.html`    | Neubauer                           |
| `poellinger1.html` | Pöllinger — Teil 1                 |
| `poellinger1b.html`| Pöllinger — Teil 1b                |
| `rauch.html`       | Rauch                              |
| `scherb.html`      | Scherb                             |
| `tuerk.html`       | Türk                               |

### `01_Archiv/X-Byloff/`

Teile zur Byloff-Forschung — `byloff1.html` … `byloff4.html`.

### `01_Archiv/Archiv Homepageentwicklung/`

Historische Entwicklungs­versionen seit 2010. Nur als Referenz, **nicht**
als Migrations­basis verwenden — vieles davon ist in den späteren Versionen
schon konsolidiert.

## Forschungs­dokumente (nicht-HTML)

Für neue Inhalte:

- **Originalprotokolle (transkribiert):**
  `01_Archiv/Handschriftl. Originalprotokolle/`
- **Übersetzungen:**
  `01_Archiv/Übersetzung Prozess gegen Dorothea Wed.docx`
  `04_Google_Drive/Aktuelle_Uebersetzungen/`
- **Forschungsliteratur (PDF):**
  `01_Archiv/Buchkopien/`
  `01_Archiv/Compendium maleficarum.pdf`
  `01_Archiv/Gallerin 1. Teil.pdf`, `Gallerin 2.+ 3. Teil.pdf`
- **Bücherüberblick:**
  `01_Archiv/Literaturhinweise/`
- **Aktuelles & Magisches Denken:**
  `01_Archiv/Hexerei heute/`
  `01_Archiv/Magische Welt/`

## Bilder

- **Prozess-Fotos (Orte):** `02_Fotos/<Ortsname>/` — z. B. Aflenz,
  Ankenstein, Riegersburg, Schöckl …
- **Hintergrund­vorlagen (alte Site):** `01_Archiv/Hintergrundvorlagen/`
  — historisch, für moderne Site i. d. R. nicht mehr passend.

## Migrations-Workflow

1. Wähle einen Prozess aus, den du migrieren willst (z. B. *Pöllinger*).
2. Lies die Quell-HTML(s) aus `01_Archiv/X-Juli-2012/poellinger1.html` und
   ggf. `poellinger1b.html`.
3. Lege `src/pages/prozesse/poellinger.html` an, basierend auf
   `zechner.html` als Vorlage.
4. Übernimm den **Text-Inhalt**, lass das Word-Markup weg.
5. Bilder in `src/assets/images/poellinger/` kopieren, Pfade anpassen.
6. Trag den Prozess in `src/pages/prozesse/index.html` als Listen-Eintrag ein.
7. Im Browser testen (`npm run dev`).
8. Commit: `git commit -m "Prozess Pöllinger ergänzt"`.
