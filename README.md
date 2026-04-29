# Hexenprozesse — Homepage

Statische Website über die steirischen Hexenprozesse. Inhalte ursprünglich
von Siegfried Kramer, ehemals unter `hexenprozesse.at` veröffentlicht.

Dieses Repository ist die **moderne Neufassung** der Site. Die historischen
Originaldateien liegen *außerhalb* des Repos unter
`../01_Archiv/PHPsicherung/` bzw. `../01_Archiv/X-Juli-2012/` und werden hier
nur als Inhalts­quellen referenziert (siehe `docs/content-quellen.md`).

## Schnellstart

```bash
# Lokalen Dev-Server starten (öffnet src/ unter http://localhost:8080)
npm run dev

# Quellcode formatieren
npm run format
```

`npm run dev` ruft `npx live-server` ohne weitere Installation auf — es muss
nur Node.js (>= 18) auf dem Rechner sein.

## Verzeichnis­struktur

```
Homepage_Repo/
├── src/                    Quelldateien der Site (das, was deployt wird)
│   ├── index.html          Startseite
│   ├── pages/
│   │   ├── kontakt.html
│   │   └── prozesse/       Eine Datei je Hexenprozess
│   ├── partials/           Wiederverwendbare HTML-Schnipsel (Header/Footer)
│   ├── styles/             CSS (main.css ist Einstiegspunkt)
│   ├── scripts/            Optional JavaScript
│   └── assets/             Bilder, Fonts, Downloads
├── docs/                   Dokumentation für Entwickler
├── .gitignore
├── .gitattributes
├── .editorconfig
├── package.json
└── README.md
```

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

Die Site ist Static-HTML — folgende Optionen funktionieren ohne Anpassung:

| Hoster | Verfahren |
|---|---|
| Netlify, Cloudflare Pages, Vercel | Repo verbinden, Publish-Dir auf `src` setzen |
| GitHub Pages | Branch `main`, Ordner `/src` als Pages-Root |
| Klassisches Webhosting (FTP) | Inhalt von `src/` per FTP hochladen |

## Lizenz / Urheberrecht

Inhalte: Siegfried Kramer (Forschungsergebnisse, Übersetzungen, Texte) — nicht
ohne Rücksprache weitergeben. Code (HTML/CSS/JS): MIT — siehe `LICENSE`
sobald gesetzt.
