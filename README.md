# Hexenprozesse — Homepage

Statische Website über die steirischen Hexenprozesse. Inhalte ursprünglich
von Siegfried Kramer, ehemals unter `hexenprozesse.at` veröffentlicht.

Dieses Repository ist die **moderne Neufassung** der Site. Die historischen
Originaldateien liegen *außerhalb* des Repos unter
`../01_Archiv/PHPsicherung/` bzw. `../01_Archiv/X-Juli-2012/` und werden hier
nur als Inhalts­quellen referenziert (siehe `docs/content-quellen.md`).

## Schnellstart

```bash
# Einmalig: Abhängigkeiten installieren (Vite v8)
npm install

# Lokalen Dev-Server starten (Hot-Reload, http://localhost:8080)
npm run dev

# Produktions-Build erzeugen -> dist/
npm run build

# Den Produktions-Build lokal vorschauen
npm run preview

# Quellcode formatieren
npm run format
```

Voraussetzung: Node.js ≥ 20.19.

## Verzeichnis­struktur

```
Homepage_Repo/
├── src/                    Quelldateien (das, was im Editor angefasst wird)
│   ├── index.html          Startseite
│   ├── pages/
│   │   ├── kontakt.html
│   │   └── prozesse/       Eine Datei je Hexenprozess
│   ├── partials/           Wiederverwendbare HTML-Schnipsel
│   ├── styles/             CSS (main.css ist Einstiegspunkt)
│   ├── scripts/            JavaScript-Module
│   └── assets/             Bilder, Fonts, Downloads (publicDir)
├── dist/                   ← Build-Output (gitignored, von Plesk gehostet)
├── docs/                   Dokumentation
├── vite.config.js          Build-Konfiguration (MPA-Setup)
├── package.json            npm-Scripts + Dependencies
├── package-lock.json       reproducible builds (committed!)
├── .gitignore .gitattributes .editorconfig
└── README.md
```

**Trennung Quelle / Output:**
- Editiert wird ausschließlich in `src/`.
- `npm run build` erzeugt `dist/` (HTML + gehashte CSS/JS-Bundles).
- `dist/` wird **nicht** ins Git committed — auf dem Server entsteht es per Build.

## Designprinzipien

1. **Statisch & portabel** — reine HTML/CSS, keine Runtime-Abhängigkeit.
   Lässt sich auf jedem Webhoster (auch Static-Hosting wie Netlify, Cloudflare
   Pages, GitHub Pages) ohne Server deployen.
2. **Quelle vs. Build** — `src/` ist die Wahrheit; alles andere ist generiert
   oder Doku. Editiert wird ausschließlich in `src/`.
3. **Wiederverwendung über Partials** — Header und Footer sind je einmal in
   `src/partials/` definiert und werden in jede Seite eingebunden (entweder
   manuell beim Bauen oder per `<iframe>`/`fetch`-Pattern; siehe Footer in
   `src/index.html`).
4. **Inhalte vom Layout trennen** — Texte und Datenfelder in HTML; das Layout
   in CSS. Keine Inline-Styles.
5. **Mobile-first, responsive** — `main.css` startet mit Mobile-Layout,
   Media-Queries erweitern für größere Screens.
6. **Keine Build-Pflicht** — die Site läuft auch ohne Build-Schritt direkt
   aus `src/` heraus. Ein optionales `tools/build.mjs` (noch nicht
   implementiert) kann Partials einfügen, Bilder optimieren etc.

## Inhalte migrieren

Die alten Word-HTML-Dateien aus `../01_Archiv/PHPsicherung/` enthalten viel
Layout-Müll (`MsoNormal`-Klassen, inline `<font>`-Tags, etc.). Beim Migrieren
gilt:

1. **Text** ins entsprechende `src/pages/prozesse/<name>.html` übernehmen
2. **Strukturierende Tags** behalten (`<h1>`, `<h2>`, `<p>`, `<ul>`, `<table>`)
3. **Word-Klassen entfernen** (`class="MsoNormal"`, `style="..."` u. ä.)
4. **Bilder** nach `src/assets/images/<prozess>/` legen und Pfade anpassen
5. Layout kommt aus `src/styles/main.css` — nicht inline

Eine Zuordnung der alten Dateien zu Prozessen findet sich in
`docs/content-quellen.md`.

## Deployment

### Plesk (mit Git-Integration + Auto-Build)

1. In Plesk → **Websites & Domains** → Domain wählen → **Git**.
2. Repository hinzufügen (HTTPS- oder SSH-URL des Repos).
3. **Bereitstellungsmodus:** *Automatisch beim Push*.
4. **Bereitstellungspfad:** `httpdocs/dist`
   *(damit Plesk nur das Build-Output ausliefert, nicht den Quellcode).*
5. **Zusätzliche Bereitstellungsaktionen** aktivieren und eintragen:
   ```
   npm install && npm run build
   ```
6. In den Plesk-Einstellungen sicherstellen, dass eine Node.js-Version ≥ 20.19
   verfügbar ist (Plesk → Node.js-Toolkit oder NodeJS-Erweiterung).

Bei jedem Push nach `main` läuft auf dem Server `npm install && npm run build`,
und `httpdocs/dist/` enthält danach die fertige Site.

### Andere Hoster

| Hoster              | Build-Befehl   | Publish-Dir |
|---------------------|---------------|-------------|
| Netlify             | `npm run build` | `dist`      |
| Cloudflare Pages    | `npm run build` | `dist`      |
| Vercel              | `npm run build` | `dist`      |
| GitHub Pages        | über Action `npm run build` | `dist`  |
| Klassisches FTP     | lokal `npm run build` | Inhalt von `dist/` per FTP |

## Lizenz / Urheberrecht

Inhalte: Siegfried Kramer (Forschungsergebnisse, Übersetzungen, Texte) — nicht
ohne Rücksprache weitergeben. Code (HTML/CSS/JS): MIT — siehe `LICENSE`
sobald gesetzt.
